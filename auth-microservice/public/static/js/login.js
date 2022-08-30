const App = angular.module('App', []);

App.config(($interpolateProvider) => {
  $interpolateProvider.startSymbol('((');
  $interpolateProvider.endSymbol('))');
});

const HOST = `http://localhost:8080`;

App.controller('loginCtrl', ['$scope', '$http', ($scope, $http) => {

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
        $scope.$apply(() => {
          $scope.errorMessage = data.message;
        });
      });
    });

  };

}]);