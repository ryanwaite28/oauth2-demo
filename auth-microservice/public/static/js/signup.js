const signupApp = angular.module('signupApp', []);

const HOST = `http://localhost:8080`;

signupApp.controller('signupCtrl', ['$scope', '$http', ($scope, $http) => {

  console.log({ $scope, $http }, this);
  
  $scope.logged_in = false;

  $scope.email = '';
  $scope.password = '';

  $scope.errorMessage = '';



  $scope.signup = () => {
    
    fetch(`/signup`, {
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
    .then(r => {
      console.log(r);
      if (!r.ok) {
        throw r;
      }
      return r.json();
    })
    .then((response) => {
      const params = window.location.href.split('?')[1];
      const oauth_location = `${HOST}/oauth?${params}`;
      window.location.href = oauth_location;
    })
    .catch((error) => {
      console.log(error);
      error.json().then(data => {
        console.log({ data });
        $scope.errorMessage = data.message;
        $scope.$apply();
      });
    });

  };

}]);