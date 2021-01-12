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
    }).then((response) => {
        console.log(response);
        alert(response.data.message)
    }, (error) => {
        console.log(error);
    });
    return false;
}