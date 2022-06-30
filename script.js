const dropZone = document.querySelector(".drop-zone");
const fileInput = document.querySelector("#fileInput");
const browseBtn = document.querySelector("#browseBtn");

const bgProgress = document.querySelector(".bg-progress");
const progressPercent = document.querySelector("#progressPercent");
const progressContainer = document.querySelector(".progress-container");
const progressBar = document.querySelector(".progress-bar");
const status = document.querySelector(".status");

const sharingContainer = document.querySelector(".sharing-container");
const copyURLBtn = document.querySelector("#copyURLBtn");
const fileURL = document.querySelector("#fileURL");
const emailForm = document.querySelector("#emailForm");

const toast = document.querySelector(".toast");

const hostURL = "https://easyshareapi.herokuapp.com";
const uploadURL = `${hostURL}/api/files`;
const emailURL = `${hostURL}/api/files/send`;

const maxAllowedSize = 128 * 1024 * 1024; //128 MB

browseBtn.addEventListener("click", () => {
  fileInput.click();
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  //console.log(files);

  if (files.length === 1) {
    if (files[0].size < maxAllowedSize) {
      fileInput.files = files;
      uploadFile(fileInput.files[0]);
    } 
    else {
      showToast("Max file size is 128MB");
    }
  } 
  else if (files.length > 1) {
    showToast("You can't upload Multiple files");
  }
  dropZone.classList.remove("dragged");
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragged");
  // console.log("dropping file");
});

dropZone.addEventListener("dragleave", (e) => {
  dropZone.classList.remove("dragged");
  // console.log("drag ended");
});

// file input change and uploader
fileInput.addEventListener("change", () => {
  if (fileInput.files[0].size > maxAllowedSize) {
    showToast("Max Allowed file size is 128MB");
    resetFileInput(); // Reset the input
    return;
  }
  uploadFile(fileInput.files[0]);
});

//File sharing container listeners
copyURLBtn.addEventListener("click", () => {
  fileURL.select();
  document.execCommand("copy");
  showToast("Copied to Clipboard");
});

fileURL.addEventListener("click", () => {
  fileURL.select();
});

const uploadFile = (file) => {

  const formData = new FormData();
  formData.append("myfile", file);

  //It Show the uploader
  progressContainer.style.display = "block";

  //Upload the File to Server using XHR request
  const xhr = new XMLHttpRequest();

  //Upload Progress
  xhr.upload.onprogress = (e)=> {
    //Find the percentage of file uploaded till now
    let percent = Math.round((100 * e.loaded) / e.total);

    progressPercent.innerText = percent;
    const scaleX = `scaleX(${percent / 100})`;
    bgProgress.style.transform = scaleX;
    progressBar.style.transform = scaleX;
  };

  // handle error
  xhr.upload.onerror = ()=>{
    showToast(`Error in Upload: ${xhr.status}.`);
    resetFileInput(); // Reset the input
  };

  // listen for response which will give the link
  xhr.onreadystatechange = ()=>{
    if (xhr.readyState == XMLHttpRequest.DONE) {
      onFileUploadSuccess(xhr.responseText);
    }
  };

  xhr.open("POST", uploadURL);
  xhr.send(formData);
};

const onFileUploadSuccess = (res) => {
  resetFileInput(); // Reset the input
  status.innerText = "Uploaded";

  // Remove the disabled attribute from form btn & make text send
  emailForm[2].removeAttribute("disabled");
  emailForm[2].innerText = "Send";
  progressContainer.style.display = "none"; // hide the box

  const { file: url } = JSON.parse(res);
  //console.log(url);
  sharingContainer.style.display = "block";
  fileURL.value = url;
};

emailForm.addEventListener("submit", (e) => {
  e.preventDefault(); // Stop submission

  // disable the button
  emailForm[2].setAttribute("disabled", "true");
  emailForm[2].innerText = "Sending";

  const url = fileURL.value;

  const formData = {
    uuid: url.split("/").splice(-1, 1)[0],
    emailTo: emailForm.elements["to-email"].value,
    emailFrom: emailForm.elements["from-email"].value,
  };
  
  //console.log(formData);
  fetch(emailURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showToast("Email Sent");
        sharingContainer.style.display = "none"; // hide the box
      }
    });
});

let toastTimer;
// the toast function
const showToast = (msg) => {
  clearTimeout(toastTimer);
  toast.innerText = msg;
  toast.classList.add("show");
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
};

//Reset FileInput value
const resetFileInput = ()=>{
  fileInput.value = "";
}