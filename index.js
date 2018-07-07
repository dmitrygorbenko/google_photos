var awesomer = {

	IMAGES_CONTAINER_SELECTOR: ".B6Rt6d.zcLWac.eejsDc",
	ACTIVE_IMAGES_SELECTOR: ".xfzUCb a",
	IMAGE_CONTROL_PANEL_SELECTOR: ".c9yG5b",
	EDIT_PHOTO_ICON_SELECTOR: ".mUbCce.p9Nwte.cx6Jyd[jsname=LgbsSe]",
	RESET_IMAGE_BUTTON_SELECTOR: ".O0WRkf.oG5Srb.UxubU.C0oVfc[jsname=Qccszc]",
	AUTO_IMAGE_BUTTON_SELECTOR: ".O0WRkf.oG5Srb.UxubU.C0oVfc[jsname=eIZYHf]",
	SAVE_IMAGE_BUTTON_SELECTOR: ".O0WRkf.oG5Srb.UxubU.C0oVfc[jsname=x8hlje]",
	SAVE_IMAGE_BUTTON_ON_SHARED_DIALOG_SELECTOR: ".O0WRkf.oG5Srb.HQ8yf.C0oVfc.kHssdc",
	VIGNETTE_SLIDER_SELECTOR: ".fGflG.fo0gEd.nKeP7d[jsname=zQo8yb]",
	EDITING_PANEL_SELECTOR: ".dj55pd.yDSiEe",
	LOADING_OVERLAY_SELECTOR: ".NPtrRe",
	SHARED_PHOTO_DIALOG_SELECTOR: ".g3VIld.Up8vH.J9Nfi.iWO5td",
	DISABLED_ELEMENT_CLASS_NAME: "RDPZE",
	EDITING_LAYER_CLASS_NAMES: "dj55pd yDSiEe TjOYYc",
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
			self = this;

		this._increaseTabShift();

		this.waiter = function () {

			let
				checkerResult;

			if (window.d === true) {
				debugger;
			}
			if (window.stop === true) {
				return;
			}

			checkerResult = options.checker();

			if (checkerResult === true) {
				self.debug("condition matched !!! Going to launch method: " + options.method);
				self._decreaseTabShift();

				if (options.onDone) {
					options.onDone.call(self);
				}

				self.executeMethodIn(options.method, 100);
				return;
			}
			self.debug("continue checking condition...");

			if (window.__awesomer_condition_checker) {
				clearTimeout(window.__awesomer_condition_checker);
				window.__awesomer_condition_checker = null;
			}

			window.__awesomer_condition_checker = setTimeout(function () {
				self.waiter();
			}, 500);
		};

		this.debug("starting condition checks...");
		this.waiter();
	},

	beforeReloadingPage: function() {
		this.saveProcessedImages();
	},

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

	loadProcessedImages: function() {
		let
			processedImagesString = localStorage.getItem("processedImages");

		if (processedImagesString === "null" || processedImagesString === null) {
			return;
		}

		this.processedImages = JSON.parse(processedImagesString);
	},

	saveProcessedImages: function() {
		let
			processedImagesString = JSON.stringify(this.processedImages);

		localStorage.setItem("processedImages", processedImagesString);
	},

	clearProcessedImages: function() {
		localStorage.setItem("processedImages", null);
	},

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

		this.debug("waiting for image to be opened in separate tab");

		this.imageWindow.onload = function (event) {

			self._increaseTabShift();

			self.debug("image window opened !");

			self.debug("waiting for image interface to be loaded");

			self.runWaiter({
				method: "clickOnEditPhotoButton",
				checker: self._checkerIfImageInterfaceIsLoaded.bind(self),
				onDone: function () {
					self._decreaseTabShift();
				}
			});

		};
	},

	_checkerIfImageInterfaceIsLoaded: function() {

		let
			ready = false,
			visibility,
			controlPanel,
			editIcon;

		controlPanel = this.getNode({
			context: this.imageWindow,
			selector: this.IMAGE_CONTROL_PANEL_SELECTOR,
			arrayIndex: "last",
			preFilter: function (element) {
				return element.style.display !== "none";
			}
		});

		editIcon = this.getEditButton();

		if (!controlPanel) {
			this.debug("couldn't find control panel");
			return false;
		}
		if (!editIcon) {
			this.debug("couldn't find edit button");
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

	clickOnEditPhotoButton: function () {

		let
			self = this,
			editIcon = this.getEditButton();

		this._increaseTabShift();

		this.debug("clicking on editing icon...");

		this.mouseDownUpOnElement(editIcon);

		this.debug("waiting for editing interface to be loaded...");

		this.runWaiter({
			method: "checkIfPhotoIsEnhanced",
			checker: this._expectEditingPanelToBeOpened.bind(this),
			onDone: function () {
				self._decreaseTabShift();
			}
		});
	},

	_expectEditingPanelToBeOpened: function() {
		let
			editingPanel,
			resetButton,
			autoButton,
			loadingOverlay;

		loadingOverlay = this.getNode({
			context: this.imageWindow,
			selector: this.LOADING_OVERLAY_SELECTOR,
			arrayIndex: "last",
			preFilter: function (element) {
				return element.style.display !== "none" && element.style.visibility !== "hidden";
			}
		});

		if (loadingOverlay) {
			this.debug("loading overlay is still there... waiting....");
			return false;
		}

		editingPanel = this.getNode({
			context: this.imageWindow,
			selector: this.EDITING_PANEL_SELECTOR,
			arrayIndex: "last",
			preFilter: function (panel) {
				if (panel.getAttribute("jslog").indexOf("data:media_item") === -1) {
					return false;
				}
				return panel.style.display !== "none" && panel.style.visibility !== "hidden";
			}
		});

		if (!editingPanel) {
			this.debug("failed to find editing panel");
			return false;
		}

		resetButton = this.getResetButton();
		autoButton = this.getAutoButton();

		if (!autoButton) {
			this.debug("failed to find auto button");
			return false;
		}
		if (!resetButton) {
			this.debug("failed to find reset button");
			return false;
		}

		return true;
	},

	expectToEditingPanelToBeClosed: function() {
		let editingPanel = this.getNode({
			context: this.imageWindow,
			selector: this.EDITING_PANEL_SELECTOR,
			arrayIndex: "last",
			preFilter: function (panel) {
				if (panel.getAttribute("jslog").indexOf("data:media_item") === -1) {
					return false;
				}
				return panel.style.display !== "none" && panel.style.visibility !== "hidden";
			}
		});
		return !editingPanel;
	},

	getSharedDialog: function() {
		return this.getNode({
			context: this.imageWindow,
			selector: this.SHARED_PHOTO_DIALOG_SELECTOR,
			arrayIndex: "last"
		});
	},

	getEditButton: function() {
		let
			editButton,
			postFilter,
			self = this;

		postFilter = function (button) {
			// yeah, 7 times upper to parent
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

			return false;
		};

		editButton = this.getNode({
			context:  this.imageWindow,
			selector: this.EDIT_PHOTO_ICON_SELECTOR,
			arrayIndex: 1,
			postFilter: postFilter
		});

		return editButton;
	},

	getEditingPanel: function() {
		let
			editButton,
			postFilter,
			self = this;

		postFilter = function (button) {
			// yeah, 7 times upper to parent
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

			return false;
		};

		editButton = this.getNode({
			context:  this.imageWindow,
			selector: this.EDIT_PHOTO_ICON_SELECTOR,
			arrayIndex: 1,
			postFilter: postFilter
		});

		return editButton;
	},

	getResetButton: function() {
		let
			self = this,
			button;

		button = this.getNode({
			context: this.imageWindow,
			selector: this.RESET_IMAGE_BUTTON_SELECTOR,
			arrayIndex: "last",
			preFilter: function (button) {
				// yeah, 9 times upper to parent
				var editingLayer = button;
				for (var i = 0; i < 9; i++) {
					editingLayer = editingLayer.parentNode;
				}
				if (editingLayer.className !== self.EDITING_LAYER_CLASS_NAMES) {
					return false;
				}
				if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
					return false;
				}
				if (editingLayer.style.display !== "none" && button.style.display !== "none") {
					return true;
				}
				return false;
			}
		});

		return button;
	},

	getAutoButton: function() {
		var self = this;
		return this.getNode({
			context: this.imageWindow,
			selector: this.AUTO_IMAGE_BUTTON_SELECTOR,
			arrayIndex: "last",
			preFilter: function (button) {
				// yeah, 9 times upper to parent
				var editingLayer = button;
				for (var i = 0; i < 9; i++) {
					editingLayer = editingLayer.parentNode;
				}
				if (editingLayer.className !== self.EDITING_LAYER_CLASS_NAMES) {
					return false;
				}
				if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
					return false;
				}
				if (editingLayer.style.display !== "none" && button.style.display !== "none") {
					return true;
				}
				return false;
			}
		});
	},

	getVignetteSlider: function() {
		var self = this;

		return this.getNode({
			context: this.imageWindow,
			selector: this.VIGNETTE_SLIDER_SELECTOR,
			arrayIndex: "last",
			preFilter: function (button) {
				// yeah, 10 times upper to parent
				var editingLayer = button;
				for (var i = 0; i < 10; i++) {
					editingLayer = editingLayer.parentNode;
				}
				if (editingLayer.className !== self.EDITING_LAYER_CLASS_NAMES) {
					return false;
				}
				if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
					return false;
				}
				if (editingLayer.style.display !== "none" && button.style.display !== "none") {
					return true;
				}
				return false;
			}
		});
	},

	getSaveButton: function() {
		var self = this;
		return this.getNode({
			context: this.imageWindow,
			selector: this.SAVE_IMAGE_BUTTON_SELECTOR,
			arrayIndex: "last",
			preFilter: function (button) {
				// yeah, 3 times upper to parent
				var editingLayer = button;
				for (var i = 0; i < 3; i++) {
					editingLayer = editingLayer.parentNode;
				}
				if (editingLayer.className !== self.EDITING_LAYER_CLASS_NAMES) {
					return false;
				}
				if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
					return false;
				}
				if (editingLayer.style.display !== "none" && button.style.display !== "none") {
					return true;
				}
				return false;
			}
		});
	},

	getSaveButtonOnSharedConfirmDialog: function() {
		var self = this;
		return this.getNode({
			context: this.imageWindow,
			selector: this.SAVE_IMAGE_BUTTON_ON_SHARED_DIALOG_SELECTOR,
			arrayIndex: "last",
			preFilter: function (button) {
				if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
					return false;
				}
				if (button.style.display !== "none") {
					return true;
				}
				return false;
			}
		});
	},

	checkIfPhotoIsEnhanced: function() {

		let
			resetButton,
			autoButton;

		this._increaseTabShift();

		this.debug("Getting reset and auto buttons...");

		resetButton = this.getResetButton();
		autoButton = this.getAutoButton();

		if (resetButton && autoButton) {
			// this is kind of error
			debugger;
		} else {
			debugger;
		}

		return;

		if (autoButton) {
			this.clickOnEnhanceButton();
		} else {
			this.finishProcessingImage();
		}

		this._decreaseTabShift();
	},

	clickOnEnhanceButton: function() {

		var autoButton = this.getAutoButton();

		this.debug("clicking on Auto button: ", autoButton);

		this.mouseDownUpOnElement(autoButton);

		this.debug("waiting for image to be enhanced...");

		var self = this;
		this.runWaiter({
			method: "decreaseVignetteLevel",
			checker: function() {
				var resetButton = self.getResetButton();
				return !!resetButton;
			}
		});
	},

	decreaseVignetteLevel: function() {

		var vignetteSlider = this.getVignetteSlider();

		var sliderRect = vignetteSlider.getBoundingClientRect();

		this.debug("clicking on Vignette slider: ", vignetteSlider);

		var codeAfterClick = (function(){

			this.debug("waiting for image to be vignetted...");

			this.executeMethodIn("clickOnSavePhotoButton", this.secondsToWaitForVignetting);

		}).bind(this);

		this.mouseDownUpOnElementWithDelay(vignetteSlider, codeAfterClick, {top: sliderRect.top + 20, left: sliderRect.left + 1});
	},

	clickOnSavePhotoButton: function() {

		var saveButton = this.getSaveButton();

		this.debug("clicking on Save button: ", saveButton);

		this.mouseDownUpOnElement(saveButton);

		this.debug("waiting for image be saved or confirm dialog to be opened...");

		this.runWaiter({
			method: "manageConfirmDialogOrEditingPanelClosed",
			checker: this.expectDialogOrEditingPanelClosed.bind(this)
		});
	},

	expectDialogOrEditingPanelClosed: function() {
		var dialog = this.getSharedDialog();
		var editingDialogClosed = this.expectToEditingPanelToBeClosed();

		if (editingDialogClosed) {
			return true;
		}

		if (!editingDialogClosed && dialog) {
			return true;
		}

		return false;
	},

	manageConfirmDialogOrEditingPanelClosed: function() {
		var dialog = this.getSharedDialog();
		var editingDialogClosed = this.expectToEditingPanelToBeClosed();

		if (editingDialogClosed) {
			this.debug("image is saved, finishing with this image...");
			this.finishProcessingImage();
			return;
		}

		this.debug("confirmation dialog is opened. Waiting for Save button is ready to click...");

		var self = this;
		this.runWaiter({
			method: "clickOnSaveButtonOnSharedConfirmDialog",
			checker: function() {
				var saveButton = self.getSaveButtonOnSharedConfirmDialog();
				return !!saveButton;
			}
		});
	},

	clickOnSaveButtonOnSharedConfirmDialog: function() {

		var saveButton = this.getSaveButtonOnSharedConfirmDialog();

		this.debug("clicking on Save button on confirmation dialog: ", saveButton);

		this.mouseDownUpOnElement(saveButton);

		this.debug("waiting for image be saved...");

		this.runWaiter({
			method: "finishProcessingImage",
			checker: this.expectToEditingPanelToBeClosed.bind(this)
		});
	},

	finishProcessingImage: function() {
		this.markCurrentImageAsProcessed();
		this.imagesProcessed++;
		this.saveProcessedImages();
		this.closeChildWindow();
	},

	markCurrentImageAsProcessed: function() {
		// put this image into 'processedArray'
		this.imageToProcess = this.newImagesToProcess[this.indexOfProcessingImage];
		var href = this.getHrefFromImage(this.imageToProcess);
		this.processedImages[href] = true;
	},

	closeChildWindow: function () {

		this.imageWindow.close();
		window.__awesomer_child_windows.pop();

		this.executeMethodIn("processFoundImages", this.secondsToWaitForLoading);
	},

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
