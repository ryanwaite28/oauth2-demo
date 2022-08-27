const jsonwebtoken = require(`jsonwebtoken`);



const minutes = 1000 * 60;
const minutes_5 = 1000 * 60 * 5;
const uniqueValue = () => {
  return String(Date.now()) +
    Math.random().toString(36).substr(2, 34) +
    Math.random().toString(36).substr(2, 34) +
    Math.random().toString(36).substr(2, 34)
};


function generateJWT(data) {
  // console.log(`generateJWT:`, { data });
  try {
    const jwt_token = jsonwebtoken.sign(data, (process.env.JWT_SECRET));
    return jwt_token || null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

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
  generateJWT,
  decodeJWT,
  uniqueValue,
  minutes
};