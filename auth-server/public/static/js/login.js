const loginApp = angular.module('loginApp', []);

const HOST = `http://localhost:8080`;

loginApp.controller('loginCtrl', ['$scope', '$http', ($scope, $http) => {

  console.log({ $scope, $http }, this);
  
  $scope.logged_in = false;

  $scope.email = '';
  $scope.password = '';

  $scope.errorMessage = '';



  $scope.login = () => {
    
    fetch(`/login`, {
      method: `POST`,
      credentials:  `include`,
      body: JSON.stringify({
        email: $scope.email,
        password: $scope.password
      }),
      headers: {
        'Content-Type': `application/json`,
        'Accept': `application/json`,
      }
    })
    .then(r => r.json())
    .then((response) => {
      const params = window.location.href.split('?')[1];
      const oauth_location = `${HOST}/oauth?${params}`;
      window.location.href = oauth_location;
    })
    .catch((error) => {
      console.log(error);
    });

  };

}]);