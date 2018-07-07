var awesomer = {

	IMAGES_CONTAINER_SELECTOR: ".B6Rt6d.zcLWac.eejsDc", // checked
	ACTIVE_IMAGES_SELECTOR: ".xfzUCb a", // checked
	IMAGE_CONTROL_PANEL_SELECTOR: ".c9yG5b", // checked
	EDIT_PHOTO_ICON_SELECTOR: ".mUbCce.p9Nwte.cx6Jyd[jsname=LgbsSe]", // checked

	EDITING_PANEL_SELECTOR: ".KoMJ2e", // checked
	EDITING_PANEL_PARENT_CLASS_NAMES: "zJLXnd", // checked
	EDITING_LAYER_CLASS_NAMES: "Cv8Rjc yDSiEe TjOYYc", // checked

	UNDO_EDITS_BUTTON_SELECTOR: ".A9jyad.O0WRkf.oG5Srb.UxubU.C0oVfc.pbHg1.y0Utrd[jsname=cBx52c]", // checked
	AUTO_BUTTON_SELECTOR: ".FLYYeb.i9xfbb", // checked
	AUTO_BUTTON_SELECTED_CLASS: "N2RpBe", // checked
	
	DONE_BUTTON_SELECTOR: ".A9jyad.O0WRkf.oG5Srb.UxubU.C0oVfc.OFRlLd[jsname=plIjzf]",
	SAVE_IMAGE_BUTTON_ON_SHARED_DIALOG_SELECTOR: ".O0WRkf.oG5Srb.HQ8yf.C0oVfc.kHssdc",
	LOADING_OVERLAY_SELECTOR: ".NPtrRe",
	SHARED_PHOTO_DIALOG_SELECTOR: ".g3VIld.Up8vH.J9Nfi.iWO5td",
	DISABLED_ELEMENT_CLASS_NAME: "RDPZE",
	VIEWING_LAYER_CLASS_NAMES: "Cv8Rjc yDSiEe YwDltc",

	secondsToWaitForLoading: 500,
	pixelsToScroll: 500,
	secondsToWaitForVignetting: 100,

	processedImages: {},
	newImagesToProcess: [],
	imageToProcess: false,
	indexOfProcessingImage: 0,

	methodToExecute: "",
	imagesProcessed: 0,
	imageWindow: window,

	run: function () {
		let
			self = this;

		console.clear();

		// clean internal vars
		window.d = false;
		window.stop = false;
		// and timers
		if (window.__awesomer_condition_checker) {
			clearTimeout(window.__awesomer_condition_checker);
		}
		window.__awesomer_condition_checker = null;
		// and child window links
		if (window.__awesomer_child_windows) {
			window.__awesomer_child_windows.forEach(function(wind) {
				wind.close();
			});
		}
		window.__awesomer_child_windows = [];

		this.loadProcessedImages();

		if (Object.keys(this.processedImages).length > 0) {
			if (!confirm("Do you want to continue processing images?")) {
				this.clearProcessedImages();
			}
		}

		window.onbeforeunload = function(){
			return self.beforeReloadingPage();
		};

		this.debug("launching getNode to find images container...");

		this.container = this.getNode({
			context:  window,
			selector: this.IMAGES_CONTAINER_SELECTOR
		});

		if (!this.container) {
			this.debug("Failed to get container !");
			return;
		}
		this.debug("The container is: ", this.container);

		this.executeMethodIn("findNewImages", this.secondsToWaitForLoading);
	},

	loadProcessedImages: function() {
		let
			processedImagesString = localStorage.getItem("processedImages");

		if (processedImagesString === "null" || processedImagesString === null) {
			return;
		}

		this.processedImages = JSON.parse(processedImagesString);
	},

	beforeReloadingPage: function() {
		this.saveProcessedImages();
	},

	clearProcessedImages: function() {
		localStorage.setItem("processedImages", null);
	},

	saveProcessedImages: function() {
		let
			processedImagesString = JSON.stringify(this.processedImages);

		localStorage.setItem("processedImages", processedImagesString);
	},

	// =======================================================================================================

	findNewImages: function () {
		let
			self = this,
			images,
			newImagesCount = 0;

		this.newImagesToProcess = [];
		newImagesCount = 0;

		images = this.getNodes(window, this.ACTIVE_IMAGES_SELECTOR);

		images.forEach(function (image) {
			let
				href = self.getHrefFromImage(image);

			if (!(href in self.processedImages)) {
				self.newImagesToProcess.push(image);
				newImagesCount++;
			}
		});
		this.debug("Found " + newImagesCount + " new images");

		if (newImagesCount === 0) {
			if (this.haveWeReachedBottom()) {
				this.debug("We have reached bottom, stopping...");
				this.debug("Total processed images: " + Object.keys(this.processedImages).length);
				this.saveProcessedImages();
				window.onbeforeunload = null;
				return;
			}
		} else {
			this.indexOfProcessingImage = -1;
			this.executeMethodIn("processFoundImages", 0);
			return;
		}

		this.scrollDownAndFindNextImages();
	},

	haveWeReachedBottom: function() {
		let
			newPosition = parseInt(this.container.scrollTop),
			currentPosition = parseInt(this.container.scrollTop);

		this.container.scrollTop = currentPosition + 10;
		this.container.scrollTop = currentPosition - 10;

		return newPosition === currentPosition;
	},

	scrollDownAndFindNextImages: function () {

		this.container.scrollTop = parseInt(this.container.scrollTop) + this.pixelsToScroll;

		this.executeMethodIn("findNewImages", this.secondsToWaitForLoading);
	},

	// =======================================================================================================

	processFoundImages: function () {
		if (this.indexOfProcessingImage === (this.newImagesToProcess.length - 1)) {
			this.scrollDownAndFindNextImages();
			return;
		}

		// step into next or first image
		this.indexOfProcessingImage++;

		this.executeMethodIn("openImage", 1000);
	},

	openImage: function () {

		let
			href,
			self = this;

		this.imageToProcess = this.newImagesToProcess[this.indexOfProcessingImage];

		this.debug("clicking on image: ", this.imageToProcess);

		href = this.imageToProcess.href;

		this.imageWindow = window.open(href, "awesomer", "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes");
		window.__awesomer_child_windows.push(this.imageWindow);

		this.debug("waiting for image to be opened in separate tab...");

		this.imageWindow.onload = function (event) {

			self.debug("image window has opened !");

			self.debug("waiting for the image interface to be loaded...");

			self.runWaiter({
				method: "clickOnEditPhotoButton",
				checker: self.checker_ifImageInterfaceIsLoaded.bind(self)
			});
		};
	},

	checker_ifImageInterfaceIsLoaded: function() {

		let
			ready = false,
			visibility,
			controlPanel,
			editIcon;

		this.debug("checker: if image interface is loaded");

		this.debug("launching getNode to find image control panel...");

		controlPanel = this.getNode({
			context: this.imageWindow,
			selector: this.IMAGE_CONTROL_PANEL_SELECTOR,
			preFilter: function (element) {
				return element.style.display !== "none";
			},
			arrayIndex: "last"
		});

		if (!controlPanel) {
			this.debug("couldn't find image control panel");
			return false;
		}

		this.debug("image control panel found !");

		editIcon = this.getEditButton();

		if (!editIcon) {
			return false;
		}

		visibility = controlPanel.style.visibility;

		if (visibility === "visible" || visibility === "") {
			ready = true;
		} else {
			this.debug("image control panel is not yet visible (visibility is " + visibility + " )");
		}

		return ready;
	},

	// =======================================================================================================
	
	clickOnEditPhotoButton: function () {

		let
			self = this,
			editIcon;

		this.debug("---------- next stage: clicking on editing button ----------");

		editIcon = this.getEditButton();

		this.debug("clicking on editing icon...");

		this.mouseDownUpOnElement(editIcon);

		this.debug("clicked");

		this.debug("waiting for editing interface to be loaded...");

		this.runWaiter({
			method: "checkIfPhotoIsEnhanced",
			checker: this.checker_expectEditingPanelToBeOpened.bind(this)
		});
	},

	checker_expectEditingPanelToBeOpened: function() {
		let
			editingPanel,
			doneButton,
			autoButton,
			loadingOverlay;

		this._increaseTabShift();

		this.debug("checker: editing panel is opened");

		this.debug("launching getNode to find loading overlay...");

		loadingOverlay = this.getNode({
			context: this.imageWindow,
			selector: this.LOADING_OVERLAY_SELECTOR,
			preFilter: function (element) {
				return element.style.display !== "none" && element.style.visibility !== "hidden";
			},
			arrayIndex: "last"
		});

		if (loadingOverlay) {
			this.debug("loading overlay is still there... waiting....");
			this._decreaseTabShift();
			return false;
		}

		this.debug("loading overlay disappeared, can continue...");
		
		editingPanel = this.getEditingPanel();

		if (!editingPanel) {
			this._decreaseTabShift();
			return false;
		}
		
		autoButton = this.getAutoButton();

		if (!autoButton) {
			this._decreaseTabShift();
			return false;
		}

		doneButton = this.getDoneButton();

		if (!doneButton) {
			this._decreaseTabShift();
			return false;
		}

		this._decreaseTabShift();

		return true;
	},

	expectEditingPanelToBeClosed: function() {

		let
			editingPanel = this.getEditingPanel();

		return !editingPanel;
	},

	// =======================================================================================================

	checkIfPhotoIsEnhanced: function() {

		let
			isEnhanced = false,
			autoButton;

		this.debug("---------- next stage: check if photo is enhanced ----------");

		this.debug("getting undo and auto buttons...");

		autoButton = this.getAutoButton();

		if (autoButton.className.indexOf(this.AUTO_BUTTON_SELECTED_CLASS) !== -1) {
			isEnhanced = true;
		}

		if (isEnhanced) {
			this.finishProcessingImage();
		} else {
			this.clickOnEnhanceButton();
		}
	},

	clickOnEnhanceButton: function() {

		let
			autoButton;

		this.debug("---------- next stage: enhancing photo ----------");

		this.debug("getting auto button...");

		autoButton = this.getAutoButton();

		this.debug("clicking on Auto button: ", autoButton);

		this.mouseDownUpOnElement(autoButton);

		this.debug("waiting for image to be enhanced...");

		this.runWaiter({
			method: "clickOnSavePhotoButton",
			checker: this.checker_imageGetsEnhanced.bind(this)
		});
	},

	checker_imageGetsEnhanced: function() {
		let
			undoButton;

		this._increaseTabShift();

		this.debug("checker: image gets enhanced, waiting for undo button appearing");

		undoButton = this.getUndoButton();

		this._decreaseTabShift();

		return !!undoButton;
	},

	// =======================================================================================================

	clickOnSavePhotoButton: function() {

		let
			doneButton;

		this.debug("---------- next stage: saving photo ----------");

		this.debug("getting done button...");

		doneButton = this.getDoneButton();

		this.debug("clicking on Done button: ", doneButton);

		this.mouseDownUpOnElement(doneButton);

		this.debug("waiting for image be saved or confirm dialog to be opened...");

		this.runWaiter({
			method: "manageConfirmDialogOrEditingPanelClosed",
			checker: this.checker_expectDialogOrEditingPanelClosed.bind(this)
		});
	},

	checker_expectDialogOrEditingPanelClosed: function() {

		let
			dialog,
			editingDialogClosed;

		this._increaseTabShift();

		this.debug("checker: expect shared dialog opened or editing panel closed");

		dialog = this.getSharedDialog();
		editingDialogClosed = this.expectEditingPanelToBeClosed();

		this._decreaseTabShift();

		if (editingDialogClosed) {
			return true;
		}

		if (!editingDialogClosed && dialog) {
			return true;
		}

		return false;
	},

	manageConfirmDialogOrEditingPanelClosed: function() {

		let
			self = this,
			editingDialogClosed;

		editingDialogClosed = this.expectEditingPanelToBeClosed();

		if (editingDialogClosed) {
			this.debug("image is saved, finishing with this image...");
			this.finishProcessingImage();
			return;
		}

		this.debug("confirmation dialog is opened. Waiting for Save/Done button is ready to click...");

		this.runWaiter({
			method: "clickOnSaveButtonOnSharedConfirmDialog",
			checker: function() {
				let
					doneButton;

				doneButton = self.getDoneButtonOnSharedConfirmDialog();

				return !!doneButton;
			}
		});
	},

	clickOnSaveButtonOnSharedConfirmDialog: function() {

		let
			doneButton;

		doneButton = this.getDoneButtonOnSharedConfirmDialog();

		this.debug("clicking on Save button on confirmation dialog: ", doneButton);

		this.mouseDownUpOnElement(doneButton);

		this.debug("waiting for image be saved...");

		this.runWaiter({
			method: "finishProcessingImage",
			checker: this.expectEditingPanelToBeClosed.bind(this)
		});
	},

	finishProcessingImage: function() {
		this.markCurrentImageAsProcessed();
		this.imagesProcessed++;
		this.saveProcessedImages();
		this.closeChildWindow();
	},

	markCurrentImageAsProcessed: function() {
		let
			href;

		// put this image into 'processedArray'
		this.imageToProcess = this.newImagesToProcess[this.indexOfProcessingImage];
		href = this.getHrefFromImage(this.imageToProcess);
		this.processedImages[href] = true;
	},

	closeChildWindow: function () {

		this.imageWindow.close();
		window.__awesomer_child_windows.pop();

		this.executeMethodIn("processFoundImages", this.secondsToWaitForLoading);
	},

	// =======================================================================================================

	getNode: function (options) {
		let
			nodes = options.context.document.querySelectorAll(options.selector);

		// convert into normal array
		nodes = Array.prototype.slice.call(nodes);

		if (nodes.length === 0) {
			this._increaseTabShift();
			this.debug("selector returned 0 nodes. Selector is: '" + options.selector + "'");
			this._decreaseTabShift();

			if (typeof options.arrayIndex !== "undefined") {
				if (options.arrayIndex === "all") {
					return [];
				}
				// other cases request one element
				return null;
			}

			return [];
		}

		if (typeof options.preFilter === "function") {
			let
				filteredNodes = [];

			if (nodes.length > 0) {
				nodes.forEach(function (node) {
					if (options.preFilter(node) === true) {
						filteredNodes.push(node);
					}
				});
				nodes = filteredNodes;
				if (nodes.length === 0) {
					this._increaseTabShift();
					this.debug("pre filter discarded all nodes");
					this._decreaseTabShift();
				}
			}
		}

		if (typeof options.arrayIndex !== "undefined") {
			if (typeof options.arrayIndex === "number") {
				return nodes[options.arrayIndex];
			}
			if (options.arrayIndex === "all") {
				return nodes;
			}
			if (options.arrayIndex === "last") {
				return nodes[nodes.length - 1];
			}
		}

		if (typeof options.postFilter === "function") {
			let
				filteredNodes = [];

			if (nodes.length > 0) {
				nodes.forEach(function (node) {
					if (options.postFilter(node) === true) {
						filteredNodes.push(node);
					}
				});
				nodes = filteredNodes;
				if (nodes.length === 0) {
					this._increaseTabShift();
					this.debug("post filter discarded all nodes");
					this._decreaseTabShift();
				}
			}
		}

		return nodes[0];
	},

	getNodes: function (wind, selector) {
		return this.getNode({
			context: wind,
			selector: selector,
			arrayIndex: "all"
		});
	},

	getHrefFromImage: function(image) {
		let
			href = image.href.toString();

		href = href.substr(href.lastIndexOf("/") + 1);
		return href;
	},

	// =======================================================================================================

	getEditingPanel: function() {
		let
			editingPanels,
			postFilter,
			self = this;

		postFilter = function (editingPanel) {
			let
				i,
				editingPanelParent = editingPanel;

			self._increaseTabShift();

			// yeah, 9 times upper to parent
			for (i = 0; i < 9; i++) {
				editingPanelParent = editingPanelParent.parentNode;
			}

			if (editingPanelParent.className !== self.EDITING_PANEL_PARENT_CLASS_NAMES) {
				self.debug("getEditingPanel() post filter: editingPanelParent class doesn't contain '" + self.EDITING_PANEL_PARENT_CLASS_NAMES + "' class (its class is: " + editingPanelParent.className + " )");
				self._decreaseTabShift();
				return false;
			}

			if (editingPanelParent.style.visibility === "hidden") {
				self.debug("getEditingPanel() post filter: parent of editing panel is not visible !");
				self._decreaseTabShift();
				return false;
			}

			self._decreaseTabShift();

			return true;
		};

		this.debug("launching getNode to find editing panel...");

		editingPanels = this.getNode({
			context:  this.imageWindow,
			selector: this.EDITING_PANEL_SELECTOR,
			arrayIndex: "all",
			postFilter: postFilter
		});

		if (editingPanels.length === 0) {
			this.debug("failed to find editing panel");
			return null;
		}

		this.debug("editing panel found");

		return editingPanels[0];
	},

	getEditButton: function() {
		let
			editButton,
			postFilter,
			self = this;

		postFilter = function (button) {
			let
				i,
				editingLayer = button;

			for (i = 0; i < 7; i++) {
				editingLayer = editingLayer.parentNode;
			}

			if (editingLayer.className !== self.VIEWING_LAYER_CLASS_NAMES) {
				self.debug("button class doesn't contain '" + self.VIEWING_LAYER_CLASS_NAMES + "' class (its class is: " + editingLayer.className + " )");
				return false;
			}

			if (button.getAttribute("jslog").indexOf("8919;") === -1) {
				self.debug("button attribute doesn't contain '8919;' text (its text is: " + button.getAttribute("jslog") + " )");
				return false;
			}

			if (editingLayer.style.display === "none") {
				self.debug("editing layer of edit button is not visible !");
				return false;
			}

			if (button.style.display === "none") {
				self.debug("editing layer of edit button is not visible !");
				return false;
			}

			return true;
		};

		this.debug("launching getNode to find edit photo button...");

		editButton = this.getNode({
			context:  this.imageWindow,
			selector: this.EDIT_PHOTO_ICON_SELECTOR,
			arrayIndex: 1,
			postFilter: postFilter
		});

		if (editButton) {
			this.debug("found edit photo button !");
		} else {
			this.debug("failed to find edit photo button");
		}

		return editButton;
	},

	getDoneButton: function() {

		let
			self = this,
			button;

		this.debug("launching getNode to find done button...");

		button = this.getNode({
			context: this.imageWindow,
			selector: this.DONE_BUTTON_SELECTOR,
			preFilter: function (button) {
				let
					i,
					editingLayer = button;

				self._increaseTabShift();

				if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
					self.debug("done button contains 'disabled element' class name, skipping it");
					self._decreaseTabShift();
					return false;
				}
				if (button.style.display === "none") {
					self.debug("done button is hidden");
					self._decreaseTabShift();
					return false;
				}

				for (i = 0; i < 3; i++) {
					editingLayer = editingLayer.parentNode;
				}
				if (editingLayer.className !== self.EDITING_LAYER_CLASS_NAMES) {
					self.debug("editing layer above done button does not contain required class name: should be '" + self.EDITING_LAYER_CLASS_NAMES + "', but have '" + editingLayer.className + "'");
					self._decreaseTabShift();
					return false;
				}

				if (editingLayer.style.visibility === "hidden") {
					self.debug("editing layer above done button is hidden");
					self._decreaseTabShift();
					return false;
				}

				self._decreaseTabShift();

				return true;
			},
			arrayIndex: "last"
		});

		if (button) {
			this.debug("done button found !");
		} else {
			this.debug("failed to find done button");
		}

		return button;
	},

	getUndoButton: function() {

		let
			self = this,
			button;

		this.debug("launching getNode to find undo button...");

		button = this.getNode({
			context: this.imageWindow,
			selector: this.UNDO_EDITS_BUTTON_SELECTOR,
			preFilter: function (button) {
				let
					i,
					editingLayer = button;

				self._increaseTabShift();

				if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
					self.debug("undo button contains 'disabled element' class name, skipping it");
					self._decreaseTabShift();
					return false;
				}
				if (button.style.display === "none") {
					self.debug("undo button is hidden");
					self._decreaseTabShift();
					return false;
				}

				for (i = 0; i < 3; i++) {
					editingLayer = editingLayer.parentNode;
				}
				if (editingLayer.className !== self.EDITING_LAYER_CLASS_NAMES) {
					self.debug("editing layer above undo button does not contain required class name: should be '" + self.EDITING_LAYER_CLASS_NAMES + "', but have '" + editingLayer.className + "'");
					self._decreaseTabShift();
					return false;
				}

				if (editingLayer.style.visibility === "hidden") {
					self.debug("editing layer above undo button is hidden");
					self._decreaseTabShift();
					return false;
				}

				self._decreaseTabShift();

				return true;
			},
			arrayIndex: "last"
		});

		if (button) {
			this.debug("undo button found !");
		} else {
			this.debug("failed to find undo button");
		}

		return button;
	},

	getAutoButton: function() {
		let
			self = this,
			button;

		this.debug("launching getNode to find auto button...");

		button = this.getNode({
			context: this.imageWindow,
			selector: this.AUTO_BUTTON_SELECTOR,
			arrayIndex: 1,
			postFilter: function (button) {
				let
					i,
					editingPanel = button;

				self._increaseTabShift();

				if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
					self.debug("auto button contains 'disabled element' class name, skipping it");
					self._decreaseTabShift();
					return false;
				}
				if (button.style.display === "none") {
					self.debug("auto button is hidden");
					self._decreaseTabShift();
					return false;
				}

				for (i = 0; i < 10; i++) {
					editingPanel = editingPanel.parentNode;
				}

				if (editingPanel.className !== self.EDITING_PANEL_PARENT_CLASS_NAMES) {
					self.debug("editing panel above auto button does not contain required class name: should be '" + self.EDITING_PANEL_PARENT_CLASS_NAMES + "', but have '" + editingPanel.className + "'");
					self._decreaseTabShift();
					return false;
				}
				if (editingPanel.style.visibility === "hidden") {
					self.debug("editing panel above auto button is hidden");
					self._decreaseTabShift();
					return false;
				}

				self._decreaseTabShift();

				return true;
			}
		});

		if (button) {
			this.debug("auto button found !");
		} else {
			this.debug("failed to find auto button");
		}

		return button;
	},

	getSharedDialog: function() {
		let
			dialog;

		this.debug("launching getNode to find shared photo dialog...");

		dialog = this.getNode({
			context: this.imageWindow,
			selector: this.SHARED_PHOTO_DIALOG_SELECTOR,
			arrayIndex: "last"
		});

		if (dialog) {
			this.debug("shared photo dialog found");
		} else {
			this.debug("shared photo dialog not found");
		}

		return dialog;
	},

	getDoneButtonOnSharedConfirmDialog: function() {
		let
			self = this,
			button;

		this.debug("launching getNode to find save image button on shared dialog...");

		button = this.getNode({
			context: this.imageWindow,
			selector: this.SAVE_IMAGE_BUTTON_ON_SHARED_DIALOG_SELECTOR,
			preFilter: function (button) {
				if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
					return false;
				}
				if (button.style.display !== "none") {
					return true;
				}
				return false;
			},
			arrayIndex: "last"
		});

		return button;
	},

	// =======================================================================================================

	addPositionToEvent: function(info, position) {

		info.clientX = position.left;
		info.clientY = position.top;

		info.layerX = 11;
		info.layerY = 27;

		info.pageX = position.left;
		info.pageY = position.top;

		info.screenX = position.left;
		info.screenY = position.top + 61;

		info.x = position.left;
		info.y = position.top;

		return info;
	},

	createMouseEvent: function(event, position) {
		let
			eventInfo = {
				button: 0,
				view: window,
				bubbles: true,
				cancelable: true
			};

		if (position) {
			eventInfo = this.addPositionToEvent(eventInfo, position);
		}
		return new MouseEvent(event, eventInfo);
	},

	clickOnElement: function (element, position) {
		element.dispatchEvent(this.createMouseEvent("click", position));
	},

	mouseDownUpOnElement: function (element, position) {
		element.dispatchEvent(this.createMouseEvent("mousedown", position));
		element.dispatchEvent(this.createMouseEvent("mouseup", position));
	},

	mouseDownUpOnElementWithDelay: function (element, callback, position) {
		element.dispatchEvent(this.createMouseEvent("mousedown", position));
		setTimeout((function(){
			element.dispatchEvent(this.createMouseEvent("mouseup", position));
			callback();
		}).bind(this), 100);
	},

	// =======================================================================================================

	executeMethodIn: function (method, seconds) {
		let
			self = this;

		if (window.stop === true) {
			return;
		}

		if (typeof this[method] === "undefined") {
			console.error("Failed to find method ", method, " to execute");
			return;
		}
		this.methodToExecute = method;

		if (seconds === 0) {
			this[method]();
			return;
		}

		setTimeout(function () {
			self[method]();
		}, seconds);
	},

	runWaiter: function (options) {
		let
			iterationsDone = 0,
			maxIterations = 20,
			self = this;

		this._increaseTabShift();

		this.debug("waiter: starting checking condition by timer...");

		this.waiter = function () {

			let
				checkerResult;

			if (window.d === true) {
				debugger;
			}
			if (window.stop === true) {
				return;
			}

			self.debug("waiter: launching checker...");

			checkerResult = options.checker();

			self.debug("waiter: checker() completed its execution");

			if (checkerResult === true) {


				self.debug("waiter: condition matched, going to launch the method: " + options.method);
				self._decreaseTabShift();

				if (options.onDone) {
					options.onDone.call(self);
				}

				self.executeMethodIn(options.method, 100);

				return;
			}

			self.debug("waiter: setting timer to launch next check...");

			if (window.__awesomer_condition_checker) {
				clearTimeout(window.__awesomer_condition_checker);
				window.__awesomer_condition_checker = null;
			}

			iterationsDone++;
			if (iterationsDone > maxIterations) {
				self.debug("waiter: sorry, we reached maximum amount of waiting attempts (max is " + maxIterations + ")");
				return;
			}

			window.__awesomer_condition_checker = setTimeout(function () {
				self.waiter();
			}, 500);
		};

		this.waiter();
	},

	// =======================================================================================================

	_trace: function() {
		let
			stack;

		try {
			throw new Error('myError');
		}
		catch(e) {
			stack = e.stack;
		}

		stack = stack.split("\n");

		stack.forEach(function(line, index) {
			stack[index] = line.trim().replace("at ", "").replace("Object.", "");
		});

		return stack;
	},

	debug: function() {
		let
			args,
			stack,
			addStack = false,
			tabShift;

		stack = this._trace();
		stack.shift();
		stack.shift();
		stack.shift();

		tabShift = this._getTabShift();

		args = Array.prototype.slice.call(arguments);

		args.unshift(tabShift);
		if (addStack) {
			args.push(stack);
		}

		console.log.apply(console, args);
	},

	// =======================================================================================================

	_tabShiftSize: 0,
	_increaseTabShift: function () {
		this._tabShiftSize++;
	},
	_decreaseTabShift: function () {
		this._tabShiftSize--;
		if (this._tabShiftSize < 0) {
			this._tabShiftSize = 0;
		}
	},
	_getTabShift: function () {
		let
			i,
			shift = "";

		for (i = 0; i < this._tabShiftSize; i++) {
			shift = "\t" + shift;
		}

		return shift;
	}
};
awesomer.run();
