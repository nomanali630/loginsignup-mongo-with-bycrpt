function signup() {
    axios({
        method: 'post',
        url: 'http://localhost:5000/signup',
        data: {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            phone: document.getElementById('phone').value,
            gender: document.getElementById('gender').value,
        }
    })
        .then((response) => {
            console.log(response);
            // alert(response.data.message)
        })
        .catch((err) => {
            console.log("Error ", err);
            // alert(response.data.message)
        })
    return false;
}
function login() {
    axios({
        method: 'post',
        url: 'http://localhost:5000/login',
        withCredentials: true,
        data: {

            email: document.getElementById('email12').value,
            password: document.getElementById('password12').value,

        }
    }).then((response) => {
        console.log(response);
        alert(response.data.message)
        window.location.href = "./login.html"
    }, (error) => {
        console.log(error);
    });
    return false;
}