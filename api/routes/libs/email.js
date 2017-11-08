var nodemailer = require('nodemailer');


var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'doctornexvietnam@gmail.com',
        pass: 'Famicare@123'
    }
});

module.exports.transporterEmail = function (email, subject, text, html) {


    var mailOptions = {
        from: 'Noreply <Noreply@example.com>', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: text //, // plaintext body
        // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
    };
    if (html)
        mailOptions.html = html


    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);

        } else {
            console.log('Message sent: ' + info.response);

        };
    });


};



module.exports.sendActiveDevice = function (code) {

    var content = "";
    content += "<!DOCTYPE html>";
    content += "<html lang=\"en\">";
    content += "";
    content += "<body>";
    content += "    <h3>Xin chào <\/h3>";
    content += "";
    content += "    <div>";
    content += "        <label>  Tài khoản của bạn đang được đăng nhập bằng một thiết bị khác. Để tiếp tục vui lòng nhập mã " + "<b>" + code + "<\/b>" + " để tiếp tục  <\/label>";
    content += "    <\/div>";
    content += "    <div>";
    content += "   <label>  <\/label>" + "<\/div>";
    content += "    <p> Sincerely, <br\/>";
    content += "     Famicare Team <\/p>";
    content += "<\/body>";
    content += "";
    content += "<\/html>";

    return content;


};





module.exports.sendActiveCode = function (code) {

    var content = "";
    content += "<!DOCTYPE html>";
    content += "<html lang=\"en\">";
    content += "";
    content += "<body>";
    content += "    <h3>Hello <\/h3>";
    content += "";
    content += "    <div>";
    content += "        <label>  Verifycode:   <\/label>" + code + "";
    content += "    <\/div>";
    content += "    <div>";
    content += "    <p> Sincerely, <br\/>";
    content += "     Famicare Team <\/p>";
    content += "<\/body>";
    content += "";
    content += "<\/html>";

    return content;


};



module.exports.sendForgotPass = function (code) {


    //to do content for fogotpassword

    var content = "";
    content += "<!DOCTYPE html>";
    content += "<html lang=\"en\">";
    content += "";
    content += "<body>";
    content += "    <h3>Hello <\/h3>";
    content += "";
    content += "    <div>";
    content += "        <label>   Verifycode:   <\/label>" + code + "";
    content += "    <\/div>";
    content += "    <div>";
    content += "    <p> Sincerely, <br\/>";
    content += "     Famicare Team <\/p>";
    content += "<\/body>";
    content += "";
    content += "<\/html>";

    return content;


};