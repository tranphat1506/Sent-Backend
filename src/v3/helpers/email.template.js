const mjml2Html = require('mjml');
const homeImageUrl =
    'http://localhost:3000/static/media/game-heaven-high-resolution-logo-color-on-transparent-background.8ef52ade912c9f6b67e6.png';
const homeUrl = process.env.FE_URL;
const sendVerifyEmail = (verifyLink, clientName) => {
    return mjml2Html(`<mjml>
    <mj-head>
       <mj-font name="Maven Pro"
         href="https://fonts.googleapis.com/css?family=Maven+Pro:Maven+Pro:wght@400;500;600" />
     </mj-head>
    <mj-body>
      <mj-section>
        <mj-column>
  
          <mj-image href="${homeUrl}" width="300px" src="${homeImageUrl}"></mj-image>
  
          <mj-divider border-width="2px" border-color="lightgrey"></mj-divider>
  
          <mj-text font-size="20px" color="#111" font-family="Maven Pro" font-weight="400">Chào mừng <span style="font-weight: 600">${clientName}</span>🤝,</mj-text>        
  
          <mj-button font-size="17px" background-color="#111" font-family="Maven Pro" href="${verifyLink}" text-transform="uppercase" font-weight="600" padding="15px">Xác minh email</mj-button>
          
          <mj-text font-size="17px" color="#111" font-family="Maven Pro" font-weight="400">Chúng tôi gửi cho bạn email này để xác nhận rằng bạn đã đăng ký bên chúng tôi.</mj-text>
          
          <mj-text font-size="17px" color="#111" font-family="Maven Pro" font-weight="400">Việc xác minh địa chỉ email sẽ đảm bảo lớp bảo mật cho tài khoản. Hỗ trợ về tài khoản dễ dàng hơn.</mj-text>
          <mj-divider border-width="2px" border-color="lightgrey"></mj-divider>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>`);
};

module.exports = {
    sendVerifyEmail,
};
