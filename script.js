function showSocial(memberDiv) {
    let modal = document.getElementById("Socal");
    let name = document.getElementById("memberName");
    let img = document.getElementById("memberImg");
    let fb = document.getElementById("fbLink");
    let insta = document.getElementById("instaLink");

    // data-attribute থেকে member info নাও
    name.textContent = memberDiv.dataset.name;
    img.src = memberDiv.dataset.img;
    fb.href = memberDiv.dataset.fb;
    insta.href = memberDiv.dataset.insta;

    modal.style.display = "block"; // modal দেখাও
}

function closeSocial() {
    document.getElementById("Socal").style.display = "none";
}

// Click outside modal to close
window.onclick = function(event) {
    let modal = document.getElementById("Socal");
    if(event.target === modal) {
        modal.style.display = "none";
    }
}
