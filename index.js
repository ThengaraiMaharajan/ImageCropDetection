const fragment = window.location.hash.substring(1);
let MainUrlParams = new URLSearchParams(fragment);
const token = MainUrlParams.get('token');
// console.log(token);
localStorage.setItem('token',token);

const userDisclaimer = document.getElementById('user-disclaimer');
const addImageDisclaimer = document.getElementById('add-images-disclaimer');
const captureFileButton = document.getElementById('captureFile');
const uploadFileButton = document.getElementById('uploadFile');
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

function handleFileUpload(event) {
  uploadFileButton.style.display = 'none';
  captureFileButton.style.display = 'none';
  const file = event.target.files[0];
  if (file) {
    if (file.type !== 'application/pdf') {
      fileStatusTag.innerHTML = `<p class="text-danger">Error: Only PDF files are allowed.</p>`;
      uploadFileButton.style.display = 'inline';
      captureFileButton.style.display = 'inline';
      return;
    }
    fileStatusTag.innerHTML = `
    <p class="text-success">
    <i class="fa fa-check"></i> ${file.name}
    </p>
    <button class="btn btn bg-main-theme btn-lg bigButton" onclick="submitFilesFn()">Submit</button>
    `;
    // console.log('File selected:', file);
    uploadStatus = 'success';
    uploadStatusCode = 1;
    uploadedFileData = file;
  } else {
    uploadStatus = 'failure';
    uploadStatusCode = 2;
  }
}

async function submitFilesFn() {
  addImageDisclaimer.style.display = 'none';
  captureFileButton.style.display = 'none';
  submitImagesBtn.style.display = 'none';
  userDisclaimer.style.display = 'none';
  fileStatusTag.style.display = 'none';
  document.getElementById('thumbnails').style.display = 'none';
  const uploadFileToAPI = document.getElementById('uploadFileToAPI');
  uploadFileToAPI.innerHTML = `
    <h4 class="text-center" >Uploading PDF for Motor Claim Form</h4>
    <div class="d-flex justify-content-center" ><img src="./assets/pictures/fileUploadGif.gif" alt="loader Gif" /></div>
  `
  const uploadFileToAPIStatus = document.getElementById('uploadFileToAPIStatus');
  uploadFileToAPIStatus.innerHTML = `
    <p class="m-0 p-0" > Uploading your PDF</p>
  `
  try {
    let formData = new FormData();
    formData.append('file', uploadedFileData, uploadedFileData.name);
    formData.append('fileType', 'pdf');
    formData.append('page', 1);
    formData.append('isFinalPage', true);
    formData.append('uniqueRequestID',0);
    formData.append('qrid', token);
    
    const response = await fetch('https://uat-aki-api-v2.claims.digital/api/v3/webapi/admin/web/OCRFileUpload', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      responseFromApi = await response.json();
      let resposeAttachmentId = responseFromApi.rObj.attachmentID;
      
      if (responseFromApi.rcode == 1) {
        setTimeout(() => {
        getApiData(resposeAttachmentId);
        }, 5000);
      }else  if (responseFromApi.rcode == 3) {
        somethingWentWrong();
      } else {
        somethingWentWrong();
      }
    } else {
      throw new Error('Network response was not ok.');
    }
  
  } catch (error) {
    console.error('Error uploading PDF:', error);
    somethingWentWrong();
  }
}

function displayImage(event) {
  userDisclaimer.style.display = 'none';
  uploadFileButton.style.display = 'none';
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
  // console.log(images);
  if(images.length>=1){
    submitImagesBtn.style.display = 'inline';
  }else{
    submitImagesBtn.style.display = 'none';
  }
}

function deleteImage(index) {
  images.splice(index, 1); // Remove the image from the array
  updateGallery(); // Update the gallery display
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
  // console.log('image collection before conversion: ', images);
  const uploadFileToAPI = document.getElementById('uploadFileToAPI');
  uploadFileToAPI.innerHTML = `
    <h4 class="text-center" >Uploading Images for Motor Claim Form</h4>
    <div class="d-flex justify-content-center" ><img src="./assets/pictures/fileUploadGif.gif" alt="loader Gif" /></div>
  `
  const uploadFileToAPIStatus = document.getElementById('uploadFileToAPIStatus');
  const token = localStorage.getItem('token');
  for (let i = 0; i < images.length; i++) {
    uploadFileToAPIStatus.innerHTML = `
      <p class="m-0 p-0"> <strong>Uploading ${i + 1} / ${images.length} images</strong> </p>
    `;
    try {
      let formData = new FormData();
      formData.append('file', images[i].blob, `image${i + 1}.png`);
      formData.append('fileType', 'image');
      formData.append('page', i + 1);
      formData.append('isFinalPage', images.length === i + 1);
      if(responseFromApi.rObj){
        formData.append('uniqueRequestID',responseFromApi.rObj.attachmentID);
      }else{
        formData.append('uniqueRequestID',0);
      }
      formData.append('qrid', token);
      responseFromApi = await sendByteArray(formData);
      // console.log("responseFromApi", responseFromApi);
      // console.log(`Successfully uploaded image ${i + 1}`);
    } catch (error) {
      console.error(`Error uploading image ${i + 1}:`, error);
      somethingWentWrong();
    }
  }
  let resposeAttachmentId ;
  if(responseFromApi.rObj){
    resposeAttachmentId = responseFromApi.rObj.attachmentID
  }
  if(responseFromApi.rcode == 1){
    
    uploadFileToAPI.innerHTML = `
    <h4 class="text-center" >Processing Images for Motor Claim Form</h4>
    <div class="d-flex justify-content-center" ><img src="./assets/pictures/fileUploadGif.gif" alt="loader Gif" /></div>
  `
  uploadFileToAPIStatus.innerHTML = ``;
getApiData(resposeAttachmentId);
  }else  if (responseFromApi.rcode == 3) {
    somethingWentWrong();
  }else{
    somethingWentWrong();
  }
  

}

async function sendByteArray(formData) {
  const response = await fetch('https://uat-aki-api-v2.claims.digital/api/v3/webapi/admin/web/OCRFileUpload', {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const responseObject = await response.json(); // Add await here
  return responseObject;
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
  // submitImagesBtn.style.display = 'inline';
}

async function getApiData(attachmentID) {
  const url = `https://uat-aki-api-v2.claims.digital/api/v3/webapi/admin/web/OCRParseResponse?AttachmentID=${attachmentID}&qrid=${token}`;

  try {
    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    // console.log('Received data:', data);
    if(data.rcode == 1){
      uploadFileToAPI.innerHTML = ``
      uploadFileToAPIStatus.innerHTML = `
      <div class="d-flex justify-content-center align-items-center flex-dir-col" >
        <div>
          <p class="m-1 p-1">Reference ID : <strong># ${data.rObj.referenceNo}</strong> </p>
        </div>
        <div>
          <h4 class="m-1 p-1 text-center"> <strong>Motor Claim Forms Uploaded Successfully</strong> </h4>
          <p class="m-1 p-1 text-center">Please navigate back to the Bima Yangu Admin Portal to view the policy and claim alerts, as well as the completed form extraction results.</p>
        </div>
      </div>
    `;
    }else if(data.rcode == -1){
      somethingWentWrong();
    }
    else{
      somethingWentWrong();
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    somethingWentWrong();
  }
} 

function openBimayanguApp(){
  const otherProjectUrl = `https://uat-aki-v2.claims.digital/form-extract/form-extraction`;
  // Redirect to the other project
  window.location.href = otherProjectUrl;
}

function somethingWentWrong(){
  uploadFileToAPI.innerHTML = `<p class="m-1 p-1 text-center"><strong>Request New QR Code for Scanning Another Motor Claim Form</strong></p>`;
        uploadFileToAPIStatus.innerHTML = `
          <div class="d-flex justify-content-center align-items-center flex-dir-col">
            <div>
              <p class="m-1 p-1 text-center">You have already used the QR code image to capture/upload motor claim forms. Please generate a new QR code in the admin panel for scanning another motor claim form.</p>
            </div>
          </div>
        `;
}