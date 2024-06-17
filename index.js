let selectedImage = null;
let cropper = null;
let images = [];
let cropSelectedImageBtn = document.getElementById('cutPaperButton');
cropSelectedImageBtn.style.display = 'none';
let rejectBtn = document.getElementById('rejectImage');
rejectBtn.style.display = 'none';
let clearImageBtn = document.getElementById('clearImage');
clearImageBtn.style.display = 'none';
let addBtn = document.getElementById('addImage');
addBtn.style.display = 'none';
const uploadFileButton = document.getElementById('uploadFile');
const captureFileButton = document.getElementById('captureFile');
const fileStatusTag = document.getElementById('fileStatus');
const fileCaptureDiv = document.getElementById('fileCaptureDiv');
const previewImagesBtn = document.getElementById('previewImages');
const captureFileSubmitButton = document.getElementById('captureFileSubmitButton');
const captureInstructionsPara = document.getElementById('captureInstructions');
previewImagesBtn.style.display = 'none';
captureFileSubmitButton.style.display = 'none';
fileCaptureDiv.style.display = 'none';
const userDisclaimer = document.getElementById('user-disclaimer');
const fixedFooter= document.getElementById('fixed-footer');
uploadedFileData = null;
let uploadStatus;
let uploadStatusCode;
let urlParams;
document.getElementById('imageInput').addEventListener('change', displayImage);
document.getElementById('cutPaperButton').addEventListener('click', cutPaper);
document.getElementById('addImage').addEventListener('click', addImage);
document.getElementById('rejectImage').addEventListener('click', rejectImage);
document.getElementById('previewImages').addEventListener('click', previewScreen);
document.getElementById('captureFileSubmitButton').addEventListener('click', uploadCaptureAPI);
document.getElementById('clearImage').addEventListener('click', clearImageFn);

function displayImage(event) {
  userDisclaimer.style.display = 'none';
  fileCaptureDiv.style.display  = 'block';
  cropSelectedImageBtn.style.display = 'inline';
  clearImageBtn.style.display = 'inline';
  uploadFileButton.style.display = 'none';
  captureFileButton.style.display = 'none';
  const input = event.target;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.getElementById('image');
      img.onload = function () {
        img.style.display = 'block';
        document.getElementById('canvas').style.display = 'none'; // Hide the canvas initially
        selectedImage = img;
        // Trigger manual crop automatically
        manualCrop();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function manualCrop() {
  const img = document.getElementById('image');
  if (selectedImage) {
    const jscan = new jscanify();
    const cvImage = cv.imread(selectedImage);
    const maxContour = jscan.findPaperContour(cvImage);
    const {
      topLeftCorner,
      topRightCorner,
      bottomLeftCorner,
      bottomRightCorner,
    } = jscan.getCornerPoints(maxContour);

    const x = Math.min(topLeftCorner.x, bottomLeftCorner.x);
    const y = Math.min(topLeftCorner.y, topRightCorner.y);
    const width = Math.max(topRightCorner.x, bottomRightCorner.x) - x;
    const height = Math.max(bottomLeftCorner.y, bottomRightCorner.y) - y;

    const cropperOptions = {
      zoomOnTouch : false,
      zoomOnWheel : false,
      zoomable : false,
      background:false,
      movable : false,
      modal : false,
      ready() {
        cropper.setCanvasData({ left: 0, top: 0 });
        cropper.setCropBoxData({ left: x, top: y, width: width, height: height });
      }
    };

    if (cropper) {
      cropper.destroy();
    }
    cropper = new Cropper(img, cropperOptions);
  } else {
    alert("Please select an image first.");
  }
}

function cutPaper() {
  if (cropper) {
    const canvas = cropper.getCroppedCanvas();
    resizeCanvas(canvas);
    document.getElementById('canvas').replaceWith(canvas);
    canvas.id = 'canvas';
    document.getElementById('canvas').style.display = 'block';
    document.getElementById('image').style.display = 'none'; // Hide the image after cropping
    selectedImage = canvas;
    cropper.destroy();
    cropper = null;
    rejectBtn.style.display = 'inline-block';
    previewImagesBtn.style.display = 'inline-block';
    addBtn.style.display = 'inline-block';
    cropSelectedImageBtn.style.display = 'none';
    clearImageBtn.style.display = 'none';
    addImage();
  } else {
    alert("Please crop the image first.");
  }
}

function resizeCanvas(canvas) {
  canvas.style.width = '100%';
  canvas.style.height = '100%';
}

function addImage() {
  captureFileButton.style.display = 'inline';
  // Add the cropped image to the array
  const imgData = selectedImage.toDataURL(); // Convert the canvas to a data URL
  images.push({ src: imgData });
  updateGallery();

  // Clear the main cropped image view
  const canvasTag = document.getElementById('canvas');
  const img = document.getElementById('image');
  canvasTag.style.display = 'none';
  img.style.display = 'none';
  selectedImage = null;

  // Hide add, accept, and reject buttons until the next image is processed
  addBtn.style.display = 'none';
  rejectBtn.style.display = 'none';
  previewImagesBtn.style.display = 'inline';
  cropSelectedImageBtn.style.display = 'none';
  clearImageBtn.style.display = 'none';
  captureFileButton.style.display = 'inline'
}

function updateGallery() {
  const thumbnails = document.getElementById('thumbnails');
  thumbnails.innerHTML = ''; // Clear existing thumbnails
  console.log('images \n', images);
  images.forEach((image, index) => {
    // Create container for thumbnail and delete button
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'thumbnail-container border m-1 p-1';
    const thumbnailContainerLayout = document.createElement('div');
    // Create delete button
    const deleteButton = document.createElement('span');
    // deleteButton.innerHTML = `
    //   <div class="pb-1 text-right" >
    //     <span class="btn btn-sm btn-secondary" >
    //     <i class="fas fa-times"></i>
    //     </span>
    //   </div>
    // `;
    deleteButton.innerHTML = `
    <div class="pb-1 text-left" >
      ${index+1}
    </div>
  `;
    // deleteButton.onclick = () => deleteImage(index);
    thumbnailContainerLayout.appendChild(deleteButton);

    // Create img element for the thumbnail
    const img = document.createElement('img');
    img.src = image.src;
    img.className = 'thumbnail';
    thumbnailContainerLayout.appendChild(img);
    thumbnailContainer.appendChild(thumbnailContainerLayout);
    // Append container to thumbnails
    thumbnails.appendChild(thumbnailContainer);
  });
}

function deleteImage(index) {
  images.splice(index, 1); // Remove the image from the array
  updateGallery(); // Update the gallery display
}

function rejectImage() {
  captureFileButton.style.display = 'inline';
  // Logic to reject the image
  if (selectedImage) {
    document.getElementById('image').style.display = 'none';
    document.getElementById('canvas').style.display = 'none';
    selectedImage = null;
    cropper = null;
    cropSelectedImageBtn.style.display = 'none';
    clearImageBtn.style.display = 'none';
    rejectBtn.style.display = 'none';
    previewImagesBtn.style.display = 'none';
    addBtn.style.display = 'none';

  } else {

  }
}

function rejectImagePreview() {}

function handleFileUpload(event) {
  uploadFileButton.style.display = 'none';
  captureFileButton.style.display = 'none';
  const file = event.target.files[0];
  if (file) {
    if (file.type !== 'application/pdf') {
      fileStatusTag.innerHTML = `<p class="text-danger">Error: Only PDF files are allowed.</p>`;
      return;
    }
    fileStatusTag.innerHTML = `
    <p class="text-success">
    <i class="fa fa-check"></i> ${file.name}
    </p>
    <button class="btn btn-sm bg-main-theme" onclick="uploadFileAPI()">Submit</button>
    `;
    console.log('File selected:', file);
    uploadStatus = 'success';
    uploadStatusCode = 1;
    uploadedFileData = file;
  } else {
    uploadStatus = 'failure';
    uploadStatusCode = 2;
  }
}

function uploadFileAPI(){
  if(uploadedFileData){
    urlParams = `statusCode=${encodeURIComponent(uploadStatusCode)}&status=${encodeURIComponent(uploadStatus)}`
    window.location.href = `./statusComponent/statusComponent.html?${urlParams}`;
  }else{
    urlParams = `statusCode=${encodeURIComponent(uploadStatusCode)}&status=${encodeURIComponent(uploadStatus)}`
    window.location.href = `./statusComponent/statusComponent.html?${urlParams}`;
  }
}

function uploadCaptureAPI(){
  if(images.length>=1){
    uploadStatus = 'success';
    uploadStatusCode = 1;
    urlParams = `statusCode=${encodeURIComponent(uploadStatusCode)}&status=${encodeURIComponent(uploadStatus)}`
    window.location.href = `./statusComponent/statusComponent.html?${urlParams}`;
  }else{
    urlParams = `statusCode=${encodeURIComponent(uploadStatusCode)}&status=${encodeURIComponent(uploadStatus)}`
    window.location.href = `./statusComponent/statusComponent.html?${urlParams}`;
  }
}

function previewScreen(){
  captureFileButton.style.display = 'none';
  captureFileSubmitButton.style.display = 'inline';
  previewImagesBtn.style.display = 'none';
}

function clearImageFn() {
  const imgElement = document.getElementById('image');
  if (imgElement) {
    imgElement.src = '';  // Clear the image source
    imgElement.style.display = 'none';  // Hide the image element
  }

  // Optionally reset other elements like canvas, buttons, etc.
  document.getElementById('canvas').style.display = 'none';
  fileCaptureDiv.style.display = 'none';
  cropSelectedImageBtn.style.display = 'none';
  clearImageBtn.style.display = 'none';
  captureFileButton.style.display = 'inline';
  rejectBtn.style.display = 'none';

  // If using a cropper, destroy the cropper instance
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}
