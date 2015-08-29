var IMAGES_CONTAINER_SELECTOR = ".B6Rt6d.zcLWac.eejsDc";
var ACTIVE_IMAGES_SELECTOR = ".xfzUCb a";
var IMAGE_HOVER_SELECTOR = ".dj55pd.yDSiEe.N8gJjf";
var EDIT_PHOTO_ICON_SELECTION = ".mUbCce.p9Nwte.nBfeh[jsname=LgbsSe]";
var CLOSE_IMAGE_ICON_SELECTOR = ".mUbCce.p9Nwte.nBfeh a";
var RESET_IMAGE_BUTTON_SELECTOR = ".O0WRkf.oG5Srb.UxubU.C0oVfc[jsname=Qccszc]";
var AUTO_IMAGE_BUTTON_SELECTOR = ".O0WRkf.oG5Srb.UxubU.C0oVfc[jsname=eIZYHf]";
var SAVE_IMAGE_BUTTON_SELECTOR = ".O0WRkf.oG5Srb.UxubU.C0oVfc[jsname=x8hlje]";
var EDITING_PANEL_SELECTOR = ".dj55pd.yDSiEe";
var LOADING_OVERLAY_SELECTOR = ".NPtrRe";
var DISABLED_ELEMENT_CLASS_NAME = "RDPZE";
var EDITING_LAYER_CLASS_NAMES = "dj55pd yDSiEe";
var VIEWING_LAYER_CLASS_NAMES = "dj55pd yDSiEe N8gJjf";

var secondsToWaitForLoading = 500;
var pixelsToScroll = 500;

var awesomer = {

	processedImages: {},
	newImagesToProcess: [],
	imageToProcess: false,
	indexOfProcessingImage: 0,

	methodToExecute: "",
	imagesProcessed: 0,

	debug: function() {
		console.log.apply(console, arguments);
	},

	run: function () {
		console.clear();

		this.loadProcessedImages();

		this.container = this.getNode(IMAGES_CONTAINER_SELECTOR);
		this.executeIn("findNewImages", secondsToWaitForLoading);
	},

	executeIn: function (method, seconds) {
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
				debugger
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

	getNode: function (selector, modifier, filter) {
		var nodes = document.querySelectorAll(selector);

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

	getNodes: function (selector) {
		return this.getNode(selector, "all");
	},

	getHrefFromImage: function(image) {
		var href = image.href.toString();
		href = href.substr(href.lastIndexOf("/") + 1);
		return href;
	},

	findNewImages: function () {

		this.newImagesToProcess = [];
		var newImagesCount = 0;
		var images = this.getNodes(ACTIVE_IMAGES_SELECTOR);

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

		this.container.scrollTop = parseInt(this.container.scrollTop) + pixelsToScroll;

		this.executeIn("findNewImages", secondsToWaitForLoading);
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

	getEditButton: function() {
		return this.getNode(EDIT_PHOTO_ICON_SELECTION, "last", function (element) {
			// yeah, 7 times upper to parent
			var editingLayer = element;
			for (var i = 0; i < 7; i++) {
				editingLayer = editingLayer.parentNode;
			}
			if (editingLayer.className !== VIEWING_LAYER_CLASS_NAMES) {
				return false;
			}
			return editingLayer.style.display !== "none" && element.style.display !== "none";
		})
	},

	processImage: function (imageTag) {

		this.imageToProcess = this.newImagesToProcess[this.indexOfProcessingImage];

		this.debug("clicking on image: ", this.imageToProcess);

		//var href = this.imageToProcess.href;
		//console.log("href: ", href);
		//this.imageWindow = window.open(href, "awesomer", "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes");

		this.clickOnElement(this.imageToProcess);

		this.debug("waiting for image to be opened");

		var self = this;
		this.runWaiter("clickOnEditPhotoButton", function () {
			var imageHover = self.getNode(IMAGE_HOVER_SELECTOR, "last", function (element) {
				return element.style.display !== "none";
			});
			var editIcon = self.getEditButton();
			if (!imageHover || !editIcon) {
				return false;
			}
			return imageHover.style.visibility === "visible";
		});

	},

	clickOnEditPhotoButton: function () {

		var editIcon = this.getEditButton();

		this.mouseDownUpOnElement(editIcon);

		this.debug("waiting for editing interface to be loaded");

		this.runWaiter("checkIfPhotoIsEnhanced", this.expectToEditingPanelToBeOpened.bind(this));
	},

	expectToEditingPanelToBeOpened: function() {
		var loadingOverlay = this.getNode(LOADING_OVERLAY_SELECTOR, "last", function (element) {
			return element.style.display !== "none" && element.style.visibility !== "hidden";
		});
		if (loadingOverlay) {
			return false;
		}

		var editingPanel = this.getNode(EDITING_PANEL_SELECTOR, "last", function (panel) {
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
		var editingPanel = this.getNode(EDITING_PANEL_SELECTOR, "last", function (panel) {
			if (panel.getAttribute("jslog").indexOf("data:media_item") === -1) {
				return false;
			}
			return panel.style.display !== "none" && panel.style.visibility !== "hidden";
		});
		return !editingPanel;
	},

	getResetButton: function() {
		return this.getNode(RESET_IMAGE_BUTTON_SELECTOR, "last", function (button) {
			// yeah, 9 times upper to parent
			var editingLayer = button;
			for (var i = 0; i < 9; i++) {
				editingLayer = editingLayer.parentNode;
			}
			if (editingLayer.className !== EDITING_LAYER_CLASS_NAMES) {
				return false;
			}
			if (button.className.indexOf(DISABLED_ELEMENT_CLASS_NAME) !== -1) {
				return false;
			}
			if (editingLayer.style.display !== "none" && button.style.display !== "none") {
				return true;
			}
			return false;
		});
	},

	getAutoButton: function() {
		return this.getNode(AUTO_IMAGE_BUTTON_SELECTOR, "last", function (button) {
			// yeah, 9 times upper to parent
			var editingLayer = button;
			for (var i = 0; i < 9; i++) {
				editingLayer = editingLayer.parentNode;
			}
			if (editingLayer.className !== EDITING_LAYER_CLASS_NAMES) {
				return false;
			}
			if (button.className.indexOf(DISABLED_ELEMENT_CLASS_NAME) !== -1) {
				return false;
			}
			if (editingLayer.style.display !== "none" && button.style.display !== "none") {
				return true;
			}
			return false;
		})
	},

	getSaveButton: function() {
		return this.getNode(SAVE_IMAGE_BUTTON_SELECTOR, "last", function (button) {
			// yeah, 3 times upper to parent
			var editingLayer = button;
			for (var i = 0; i < 3; i++) {
				editingLayer = editingLayer.parentNode;
			}
			if (editingLayer.className !== EDITING_LAYER_CLASS_NAMES) {
				return false;
			}
			if (button.className.indexOf(DISABLED_ELEMENT_CLASS_NAME) !== -1) {
				return false;
			}
			if (editingLayer.style.display !== "none" && button.style.display !== "none") {
				return true;
			}
			return false;
		})
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

		this.debug("waiting for image be saved...");

		this.runWaiter("finishProcessingImage", this.expectToEditingPanelToBeClosed.bind(this));
	},

	finishProcessingImage: function() {
		this.markCurrentImageAsProcessed();
		this.imagesProcessed++;
		this.clickOnCloseImageIcon();
	},

	markCurrentImageAsProcessed: function() {
		// put this image into 'processedArray'
		this.imageToProcess = this.newImagesToProcess[this.indexOfProcessingImage];
		var href = this.getHrefFromImage(this.imageToProcess);
		this.processedImages[href] = true;

	},

	clickOnCloseImageIcon: function () {

		var closeImageIcon = this.getNode(CLOSE_IMAGE_ICON_SELECTOR, "last");

		this.debug("clicking on close image icon: ", closeImageIcon);

		this.clickOnElement(closeImageIcon);

		this.debug("waiting for image to be closed");

		var self = this;
		this.runWaiter("processFoundImages", function () {
			var image_hover = self.getNode(IMAGE_HOVER_SELECTOR, "last", function (element) {
				return element.style.display !== "none";
			});
			if (!image_hover) {
				return true;
			}
			return image_hover.style.visibility === "hidden";
		});
	}
};


window.onbeforeunload = function(){
	return awesomer.beforeReloadingPage();
};
awesomer.clearProcessedImages();
awesomer.run();
