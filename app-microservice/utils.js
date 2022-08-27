const jsonwebtoken = require(`jsonwebtoken`);

function decodeJWT(token) {
  try {
    const data = jsonwebtoken.verify(token, (process.env.JWT_SECRET));
    // console.log(`decodeJWT:`, { data });
    return data;
  } catch (e) {
    console.log(e);
    return null;
  }
}



module.exports = {
  decodeJWT
};