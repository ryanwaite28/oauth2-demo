const App = angular.module('App', []);

App.config(($interpolateProvider) => {
  $interpolateProvider.startSymbol('((');
  $interpolateProvider.endSymbol('))');
});

const HOST = `http://localhost:8080`;

App.controller('oauthCtrl', ['$scope', '$http', ($scope, $http) => {

  console.log({ $scope, $http }, this);
  
  $scope.logout = () => {
    fetch(`/logout`, {
      method: `GET`,
      credentials:  `include`,
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
      const login_page = `${HOST}/login?${params}`;
      window.location.href = login_page;
    })
    .catch((error) => {
      console.log(error);
      error.json && error.json().then(data => {
        console.log({ data });
        
        $scope.$apply(() => {
          $scope.errorMessage = data.message;
        });
      });
    });
  };

}]);