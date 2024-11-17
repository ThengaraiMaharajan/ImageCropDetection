const userDisclaimer = document.getElementById('user-disclaimer');
const addImageDisclaimer = document.getElementById('add-images-disclaimer');
const captureFileButton = document.getElementById('captureFile');
const fileStatusTag = document.getElementById('fileStatus');
let confirmCropBtn = document.getElementById('confirmCropButton');
confirmCropBtn.style.display = 'none';
let rejectImageBtn = document.getElementById('rejectImage');
rejectImageBtn.style.display = 'none';
let addImageToGalleryBtn = document.getElementById('addImageToGallery');
addImageToGalleryBtn.style.display = 'none';
const submitImagesBtn = document.getElementById('submitImages');
const captureFileSubmitButton = document.getElementById('captureFileSubmitButton');
submitImagesBtn.style.display = 'none';
captureFileSubmitButton.style.display = 'none';
const fixedFooter= document.getElementById('fixed-footer');
addImageDisclaimer.style.display = 'none';
let responseFromApi = {};

uploadedFileData = null;
let uploadStatus;
let uploadStatusCode;
let urlParams;
let selectedImage = null;
let cropper = null;
let images = [];

document.getElementById('imageInput').addEventListener('change', displayImage);
document.getElementById('confirmCropButton').addEventListener('click', cutPaper);
document.getElementById('addImageToGallery').addEventListener('click', addImageToGalleryFn);
document.getElementById('submitImages').addEventListener('click', submitImagesFn);
document.getElementById('captureFileSubmitButton').addEventListener('click', uploadCaptureAPI);
document.getElementById('rejectImage').addEventListener('click', rejectImageFn);

function displayImage(event) {
  userDisclaimer.style.display = 'none';
  captureFileButton.style.display = 'none';
  thumbnails.style.display = 'none';
  submitImagesBtn.style.display = 'none';
  confirmCropBtn.style.display = 'inline';
  rejectImageBtn.style.display = 'inline';
  addImageDisclaimer.style.display = 'none';
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
document.getElementById('imageInput').addEventListener('change', displayImage);

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
    addImageDisclaimer.style.display = 'inline';
    const canvas = cropper.getCroppedCanvas();
    resizeCanvas(canvas);
    document.getElementById('canvas').replaceWith(canvas);
    canvas.id = 'canvas';
    document.getElementById('canvas').style.display = 'block';
    document.getElementById('image').style.display = 'none'; // Hide the image after cropping
    selectedImage = canvas;
    cropper.destroy();
    cropper = null;
    addImageToGalleryFn();
    submitImagesBtn.style.display = 'inline-block';
    addImageToGalleryBtn.style.display = 'inline-block';
    confirmCropBtn.style.display = 'none';
    rejectImageBtn.style.display = 'none';
  } else {
    alert("Please crop the image first.");
  }
}

function resizeCanvas(canvas) {
  canvas.style.width = '100%';
  canvas.style.height = '100%';
}

function addImageToGalleryFn() {
  captureFileButton.style.display = 'inline';
  // Add the cropped image to the array
  const imgData = selectedImage.toDataURL(); // Convert the canvas to a data URL
  images.push({ src: imgData });
  updateGallery();
  convertImage(imgData);

  // Clear the main cropped image view
  const canvasTag = document.getElementById('canvas');
  const img = document.getElementById('image');
  canvasTag.style.display = 'none';
  img.style.display = 'none';
  selectedImage = null;

  // Hide add, accept, and reject buttons until the next image is processed
  addImageToGalleryBtn.style.display = 'none';
  submitImagesBtn.style.display = 'inline';
  confirmCropBtn.style.display = 'none';
  rejectImageBtn.style.display = 'none';
  captureFileButton.style.display = 'inline'
}

async function convertImage(imgData) {
  // console.log('convert image', imgData);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const img = new Image();
  img.src = imgData;
  img.onload = async () => {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    images[images.length - 1].blob = blob; // Store the blob in the images array
  };
}

function updateGallery() {
  const thumbnails = document.getElementById('thumbnails');
  thumbnails.style.display = 'flex';
  thumbnails.innerHTML = ''; // Clear existing thumbnails
  images.forEach((image, index) => {
    // Create container for thumbnail and delete button
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'thumbnail-container border m-1 p-1';
    const thumbnailContainerLayout = document.createElement('div');
    // Create delete button
    const deleteButton = document.createElement('div');
    deleteButton.className = 'pb-1';
    deleteButton.innerHTML = `
      <span class="float-left aTag">
      Page : ${index+1}
      </span>
      <span class="btn btn-sm btn-secondary float-right" >
        <i class="fas fa-times"></i>
      </span>
      <br/>
    `;
    deleteButton.onclick = () => deleteImage(index);
    thumbnailContainerLayout.appendChild(deleteButton);
    // Create img element for the thumbnail
    const img = document.createElement('img');
    img.src = image.src;
    img.className = 'thumbnail';
    const imgContainer = document.createElement('div');
    imgContainer.className = 'mt-2';
    imgContainer.appendChild(img);
    thumbnailContainerLayout.appendChild(imgContainer);
    thumbnailContainer.appendChild(thumbnailContainerLayout);
    // Append container to thumbnails
    thumbnails.appendChild(thumbnailContainer);
  });
  if(images.length>=1){
    submitImagesBtn.style.display = 'inline';
  }else{
    submitImagesBtn.style.display = 'none';
  }
}

function deleteImage(index) {
  images.splice(index, 1);
  updateGallery();
}


function uploadCaptureAPI(){
  if(images.length>=1){
    fileStatusTag.innerHTML = '';
    uploadStatus = 'success';
    uploadStatusCode = 1;
    urlParams = `statusCode=${encodeURIComponent(uploadStatusCode)}&status=${encodeURIComponent(uploadStatus)}`
    window.location.href = `./statusComponent/statusComponent.html?${urlParams}`;
  }else{
    urlParams = `statusCode=${encodeURIComponent(uploadStatusCode)}&status=${encodeURIComponent(uploadStatus)}`
    window.location.href = `./statusComponent/statusComponent.html?${urlParams}`;
  }
}

async function submitImagesFn(){
  addImageDisclaimer.style.display = 'none';
  captureFileButton.style.display = 'none';
  submitImagesBtn.style.display = 'none';
  document.getElementById('thumbnails').style.display = 'none';
  const uploadFileToAPI = document.getElementById('uploadFileToAPI');
  uploadFileToAPI.innerHTML = `
    <h4 class="text-center" >Processing Images</h4>
    <div class="d-flex justify-content-center" ><img src="./assets/pictures/fileUploadGif.gif" alt="loader Gif" /></div>
  `
  const uploadFileToAPIStatus = document.getElementById('uploadFileToAPIStatus');
  const token = localStorage.getItem('token');
  for (let i = 0; i < images.length; i++) {
    uploadFileToAPIStatus.innerHTML = `
      <p class="m-0 p-0"> <strong>Processing ${i + 1} / ${images.length} images</strong> </p>
    `;
  }
}


function rejectImageFn() {
  addImageDisclaimer.style.display = 'block';
  const imgElement = document.getElementById('image');
  if (imgElement) {
    imgElement.src = '';
    imgElement.style.display = 'none';
  }

  // Optionally reset other elements like canvas, buttons, etc.
  document.getElementById('canvas').style.display = 'none';
  confirmCropBtn.style.display = 'none';
  rejectImageBtn.style.display = 'none';
  captureFileButton.style.display = 'inline';

    // Clear the file input value to allow selecting the same file again if needed
    const imageInput = document.getElementById('imageInput');
    imageInput.value = '';

  // If using a cropper, destroy the cropper instance
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  updateGallery();
}