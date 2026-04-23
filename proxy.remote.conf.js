const target = 'https://cafelab-euafbrgfdja5e0h9.canadacentral-01.azurewebsites.net';

const forward = { target, secure: true, changeOrigin: true };

module.exports = {
  '/api': forward,
  '/users': forward,
  '/plans': forward,
  '/contact-us': forward,
};
