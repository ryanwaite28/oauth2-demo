const axios = require('axios').default;
axios.defaults.withCredentials = true;

const commonHeaders = {
  'Content-Type': `application/json`,
  'Accept': `application/json`,
};

class UsersMicroservice {

  static HOST = process.env.USERS_MS_HOST || `http://localhost:8084`;

  static async login(email, password) {
    return axios.post(`${this.HOST}/login`, { email, password }, { headers: { ...commonHeaders, 'Users-Microservice-Secret': process.env['USERS_MICROSERVICE_SECRET'] } })
      .then(function (response) {
        console.log(response);
        return response.data.user || null;
      })
      .catch(function (error) {
        console.log(error);
        return null;
      });
  }

  static async signup(email, password) {
    return axios.post(`${this.HOST}/signup`, { email, password }, { headers: { ...commonHeaders, 'Users-Microservice-Secret': process.env['USERS_MICROSERVICE_SECRET'] } })
      .then(function (response) {
        console.log(response);
        return response.data.user || null;
      })
      .catch(function (error) {
        console.log(error);
        return {
          error: true,
          message: error.response?.data?.message || `invalid inputs`,
          status: error.response.status
        };
      });
  }

}




module.exports = UsersMicroservice;