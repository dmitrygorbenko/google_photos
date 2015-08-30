var awesomer = {

	IMAGES_CONTAINER_SELECTOR: ".B6Rt6d.zcLWac.eejsDc",
	ACTIVE_IMAGES_SELECTOR: ".xfzUCb a",
	IMAGE_HOVER_SELECTOR: ".dj55pd.yDSiEe.N8gJjf",
	EDIT_PHOTO_ICON_SELECTOR: ".mUbCce.p9Nwte.nBfeh[jsname=LgbsSe]",
	RESET_IMAGE_BUTTON_SELECTOR: ".O0WRkf.oG5Srb.UxubU.C0oVfc[jsname=Qccszc]",
	AUTO_IMAGE_BUTTON_SELECTOR: ".O0WRkf.oG5Srb.UxubU.C0oVfc[jsname=eIZYHf]",
	SAVE_IMAGE_BUTTON_SELECTOR: ".O0WRkf.oG5Srb.UxubU.C0oVfc[jsname=x8hlje]",
	SAVE_IMAGE_BUTTON_ON_SHARED_DIALOG_SELECTOR: ".O0WRkf.oG5Srb.HQ8yf.C0oVfc.kHssdc",
	EDITING_PANEL_SELECTOR: ".dj55pd.yDSiEe",
	LOADING_OVERLAY_SELECTOR: ".NPtrRe",
	SHARED_PHOTO_DIALOG_SELECTOR: ".g3VIld.Up8vH.J9Nfi.iWO5td",
	DISABLED_ELEMENT_CLASS_NAME: "RDPZE",
	EDITING_LAYER_CLASS_NAMES: "dj55pd yDSiEe",
	VIEWING_LAYER_CLASS_NAMES: "dj55pd yDSiEe N8gJjf",

	secondsToWaitForLoading: 500,
	pixelsToScroll: 500,

	processedImages: {},
	newImagesToProcess: [],
	imageToProcess: false,
	indexOfProcessingImage: 0,

	methodToExecute: "",
	imagesProcessed: 0,
	imageWindow: window,

	debug: function() {
		console.log.apply(console, arguments);
	},

	run: function () {
		console.clear();
		
		if (!confirm("Do you want to continue processing images?")) {
			this.clearProcessedImages();
		}

		var self = this;
		window.onbeforeunload = function(){
			return self.beforeReloadingPage();
		};

		this.loadProcessedImages();

		this.container = this.getNode(window, this.IMAGES_CONTAINER_SELECTOR);
		this.executeIn("findNewImages", this.secondsToWaitForLoading);
	},

	executeIn: function (method, seconds) {
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

		var self = this;
		setTimeout(function () {
			self[method]();
		}, seconds);
	},

	runWaiter: function (functionToCallAfter, checkerFunction) {
		var self = this;

		this.waiter = function () {
			if (window.d === true) {
				debugger;
			}
			if (window.stop === true) {
				return;
			}
			if (checkerFunction() === true) {
				self.debug("condition matched !!!");
				self.executeIn(functionToCallAfter, 50);
				return;
			}
			self.debug("continue checking condition...");
			setTimeout(function () {
				self.waiter();
			}, 10);
		};

		this.debug("starting checking condition...");
		this.waiter();
	},

	beforeReloadingPage: function() {
		this.saveProcessedImages();
	},

	clickOnElement: function (element) {

		var clickEvent = new MouseEvent('click', {
			button: 0,
			view: window,
			bubbles: true,
			cancelable: true
		});

		element.dispatchEvent(clickEvent);
	},

	mouseDownUpOnElement: function (element) {
		var mouseDownEvent = new MouseEvent('mousedown', {
			button: 0,
			view: window,
			bubbles: true,
			cancelable: true
		});
		var mouseUpEvent = new MouseEvent('mouseup', {
			button: 0,
			view: window,
			bubbles: true,
			cancelable: true
		});
		element.dispatchEvent(mouseDownEvent);
		element.dispatchEvent(mouseUpEvent);
	},

	loadProcessedImages: function() {
		var processedImagesString = localStorage.getItem("processedImages");
		if (processedImagesString === "null" || processedImagesString === null) {
			return;
		}

		this.processedImages = JSON.parse(processedImagesString);
	},

	saveProcessedImages: function() {
		var processedImagesString = JSON.stringify(this.processedImages);
		localStorage.setItem("processedImages", processedImagesString);
	},

	clearProcessedImages: function() {
		localStorage.setItem("processedImages", null);
	},

	getNode: function (wind, selector, modifier, filter) {
		var nodes = wind.document.querySelectorAll(selector);

		// convert into normal array
		nodes = Array.prototype.slice.call(nodes);

		if (typeof filter === "function") {
			var filteredNodes = [];
			nodes.forEach(function (node) {
				if (filter(node) === true) {
					filteredNodes.push(node);
				}
			});
			nodes = filteredNodes;
		}

		if (typeof modifier === "number") {
			return nodes[modifier];
		}
		if (modifier === "all") {
			return nodes;
		}
		if (modifier === "last") {
			return nodes[nodes.length - 1];
		}
		return nodes[0];
	},

	getNodes: function (wind, selector) {
		return this.getNode(wind, selector, "all");
	},

	getHrefFromImage: function(image) {
		var href = image.href.toString();
		href = href.substr(href.lastIndexOf("/") + 1);
		return href;
	},

	findNewImages: function () {

		this.newImagesToProcess = [];
		var newImagesCount = 0;
		var images = this.getNodes(window, this.ACTIVE_IMAGES_SELECTOR);

		var self = this;
		images.forEach(function (image) {
			var href = self.getHrefFromImage(image);
			if (!(href in self.processedImages)) {
				self.newImagesToProcess.push(image);
				newImagesCount++;
			}
		});
		this.debug("Found ", newImagesCount, " new images");

		if (newImagesCount == 0) {
			if (this.haveWeReachedBottom()) {
				this.debug("We have reached bottom, stopping...");
				this.debug("Total processed images: ", Object.keys(this.processedImages).length);
				this.saveProcessedImages();
				window.onbeforeunload = null;
				return;
			}
		} else {
			this.indexOfProcessingImage = -1;
			this.executeIn("processFoundImages", 0);
			return;
		}

		this.scrollDownAndFindNextImages();
	},

	haveWeReachedBottom: function() {
		var currentPosition = parseInt(this.container.scrollTop);
		this.container.scrollTop = currentPosition + 10;
		var newPosition = parseInt(this.container.scrollTop);
		this.container.scrollTop = currentPosition - 10;

		return newPosition === currentPosition;
	},

	scrollDownAndFindNextImages: function () {

		this.container.scrollTop = parseInt(this.container.scrollTop) + this.pixelsToScroll;

		this.executeIn("findNewImages", this.secondsToWaitForLoading);
	},

	processFoundImages: function () {
		if (this.indexOfProcessingImage === (this.newImagesToProcess.length - 1)) {
			this.scrollDownAndFindNextImages();
			return;
		}

		// step into next or first image
		this.indexOfProcessingImage++;

		this.executeIn("processImage", 0);
	},

	processImage: function (imageTag) {

		this.imageToProcess = this.newImagesToProcess[this.indexOfProcessingImage];

		this.debug("clicking on image: ", this.imageToProcess);

		var href = this.imageToProcess.href;

		this.imageWindow = window.open(href, "awesomer", "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes");

            this.debug("waiting for image to be opened in separate tab");

            var self = this;
            this.imageWindow.onload = function(event) {
				
				self.debug("image loaded !");

                self.runWaiter("clickOnEditPhotoButton", function () {
                    var imageHover = self.getNode(self.imageWindow, self.IMAGE_HOVER_SELECTOR, "last", function (element) {
                            return element.style.display !== "none";
                    });
                    var editIcon = self.getEditButton();
                    if (!imageHover || !editIcon) {
                            return false;
                    }
	                var visibility = imageHover.style.visibility;
                    return visibility === "visible" || visibility === "";
                });

            };
	},

	clickOnEditPhotoButton: function () {

		var editIcon = this.getEditButton();
		
		this.debug("clicking on editing icon");

		this.mouseDownUpOnElement(editIcon);

		this.debug("waiting for editing interface to be loaded");

		this.runWaiter("checkIfPhotoIsEnhanced", this.expectToEditingPanelToBeOpened.bind(this));
	},

	expectToEditingPanelToBeOpened: function() {
		var loadingOverlay = this.getNode(this.imageWindow, this.LOADING_OVERLAY_SELECTOR, "last", function (element) {
			return element.style.display !== "none" && element.style.visibility !== "hidden";
		});
		if (loadingOverlay) {
			return false;
		}

		var editingPanel = this.getNode(this.imageWindow, this.EDITING_PANEL_SELECTOR, "last", function (panel) {
			if (panel.getAttribute("jslog").indexOf("data:media_item") === -1) {
				return false;
			}
			return panel.style.display !== "none" && panel.style.visibility !== "hidden";
		});
		if (!editingPanel) {
			return false;
		}

		var resetButton = this.getResetButton();
		var autoButton = this.getAutoButton();

		if (!resetButton && !autoButton) {
			return false;
		}

		return true;
	},

	expectToEditingPanelToBeClosed: function() {
		var editingPanel = this.getNode(this.imageWindow, this.EDITING_PANEL_SELECTOR, "last", function (panel) {
			if (panel.getAttribute("jslog").indexOf("data:media_item") === -1) {
				return false;
			}
			return panel.style.display !== "none" && panel.style.visibility !== "hidden";
		});
		return !editingPanel;
	},
	
	getSharedDialog: function() {
		return this.getNode(this.imageWindow, this.SHARED_PHOTO_DIALOG_SELECTOR, "last");
	},

	getEditButton: function() {
		var self = this;
		return this.getNode(this.imageWindow, this.EDIT_PHOTO_ICON_SELECTOR, "last", function (button) {
			// yeah, 7 times upper to parent
			var editingLayer = button;
			for (var i = 0; i < 7; i++) {
				editingLayer = editingLayer.parentNode;
			}
			if (editingLayer.className !== self.VIEWING_LAYER_CLASS_NAMES) {
				return false;
			}
			if (button.getAttribute("jslog").indexOf("8916;") === -1) {
				return false;
			}
			return editingLayer.style.display !== "none" && button.style.display !== "none";
		});
	},

	getResetButton: function() {
		var self = this;
		return this.getNode(this.imageWindow, this.RESET_IMAGE_BUTTON_SELECTOR, "last", function (button) {
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
		});
	},

	getAutoButton: function() {
		var self = this;
		return this.getNode(this.imageWindow, this.AUTO_IMAGE_BUTTON_SELECTOR, "last", function (button) {
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
		});
	},

	getSaveButton: function() {
		var self = this;
		return this.getNode(this.imageWindow, this.SAVE_IMAGE_BUTTON_SELECTOR, "last", function (button) {
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
		});
	},

	getSaveButtonOnSharedConfirmDialog: function() {
		var self = this;
		return this.getNode(this.imageWindow, this.SAVE_IMAGE_BUTTON_ON_SHARED_DIALOG_SELECTOR, "last", function (button) {
			if (button.className.indexOf(self.DISABLED_ELEMENT_CLASS_NAME) !== -1) {
				return false;
			}
			if (button.style.display !== "none") {
				return true;
			}
			return false;
		});
	},

	checkIfPhotoIsEnhanced: function() {

		var resetButton = this.getResetButton();
		var autoButton = this.getAutoButton();

		if (resetButton && autoButton) {
			debugger;
		}

		if (autoButton) {
			this.clickOnEnhanceButton();
		} else {
			this.finishProcessingImage();
		}
	},

	clickOnEnhanceButton: function() {

		var autoButton = this.getAutoButton();

		this.debug("clicking on Auto button: ", autoButton);

		this.mouseDownUpOnElement(autoButton);

		this.debug("waiting for image to be enhanced...");

		var self = this;
		this.runWaiter("clickOnSavePhotoButton", function() {
			var resetButton = self.getResetButton();
			return !!resetButton;
		});
	},

	clickOnSavePhotoButton: function() {

		var saveButton = this.getSaveButton();

		this.debug("clicking on Save button: ", saveButton);

		this.mouseDownUpOnElement(saveButton);

		this.debug("waiting for image be saved or confirm dialog to be opened...");

		this.runWaiter("manageConfirmDialogOrEditingPanelClosed", this.expectDialogOrEditingPanelClosed.bind(this));
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
		this.runWaiter("clickOnSaveButtonOnSharedConfirmDialog", function() {
			var saveButton = self.getSaveButtonOnSharedConfirmDialog();
			return !!saveButton;
		});
	},

	clickOnSaveButtonOnSharedConfirmDialog: function() {

		var saveButton = this.getSaveButtonOnSharedConfirmDialog();

		this.debug("clicking on Save button on confirmation dialog: ", saveButton);

		this.mouseDownUpOnElement(saveButton);

		this.debug("waiting for image be saved...");

		this.runWaiter("finishProcessingImage", this.expectToEditingPanelToBeClosed.bind(this));
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

		this.executeIn("processFoundImages", this.secondsToWaitForLoading);
	}
};
awesomer.run();
