angular.module('x-admin', ['ui.bootstrap', 'ngAnimate', 'ngDialog']).
controller('x-controller', function ($scope, $http, $document, $rootScope, ngDialog, $timeout) {
  $scope.content = '/welcome.html';
  $scope.menus = [];
  $scope.postData = [];
  $scope.selected = {text:"", num:-2};
  
  $scope.init = function(){
    $http.get("/adminMenu")
         .success(function(data, status, headers, config){
           $scope.menus = data;
           console.log("got menus");
         })
         .error(function(data, status, headers, config){
           console.log("got menus failed. status - " + status);
         });
  };
  
  function requireAuthenticate(status){
    if(status == 401 ){$scope.setContent('/admin/fragment/embeddedLogin'); return true;}
    return false;
  }
  
  function showAlert(category, msg, interval){
    var dlg = ngDialog.open({
      template: '<div class="ngdialog-message"><alert type="'+ category + '">'+ msg +'</alert></div>',
      plain: true,
      showClose: false,
      preCloseCallback: function(){
        console.log("alert close");
      }
    });
    if(interval != undefined){
      $timeout(function(){
        if(ngDialog.isOpen(dlg.id))dlg.close();
      }, interval);
    }  
  }
  
  $scope.setContent = function(action){
    console.log(action);
    var sep = action.indexOf('?');
    if(sep != -1){
      var dataUri = action.slice(sep+1).replace(/\./g, '/');
      console.log("dataUri - ", dataUri);
      $scope.data = null;
      $http.get('/' + dataUri)
        .success(function(data, status, headers, config){
          console.log("got data for - ", action, "  ", data);;
          $scope.data = data;
        })
        .error(function(data, status, headers, config){
          console.log("got data failed. status - " + status);
          requireAuthenticate(status);
        });
        
      //action = action.substring(0, sep);
    }
    $scope.content=action; 
  };

  $scope.deleteConfirm = function(action, msg){
    ngDialog.openConfirm({
      template: 'delConfirmDlgId',
      className: 'ngdialog-theme-default'
    }).then(function(value){
      console.log("delete confirmed for - ", action);
      $http.get(action)
         .success(function(data, status, headers, config){
           showAlert('success', msg + "成功", 2000);
           $scope.setContent($scope.content);
         })
         .error(function(data, status, headers, config){
           console.log("do delete failed. status - " + status);
           if(!requireAuthenticate(status)) showAlert('danger', msg + "失败 - " + status, 4000);
         });
    },function(reason){
      //do nothing
    });
  };
  
  $scope.repackDlgInputInfo = function(value){
    console.log('repackInputInfo - ', value);
	$scope.postData = []; //reset
    var el = angular.element(document.querySelector(value));
    if(el){
      var list = el.find('input');
      for(var i = 0; i < list.length; i++){
        $scope.postData.push({
          name: list[i].name,
          value: list[i].value
        });
        console.log(list[i].name, ' - ', list[i].value);
      }
      if($scope.selected.num != -2){
        $scope.postData.push({
          name: "selected",
          value: $scope.selected
        });
      }
      console.log($scope.postData);
    }
  }
  
  $scope.addOneConfirm = function(action, tpl, extraDataUri, msg){
    if(extraDataUri != undefined  && extraDataUri != null){
    $http.get(extraDataUri).
      success(function(data, status, headers, config){
        console.log("got data for - ", extraDataUri);
        $scope.subdata = data;
      }).
      error(function(data, status, headers, config){
        console.log("got extraData failed - ", status);
      });
    }
      
    ngDialog.openConfirm({
      template: tpl,
      className: 'ngdialog-theme-default',
      preCloseCallback: function(value){
        console.log('preCloseCallback - ', value);
        $scope.passwordNotEqual = false;
        return true;
      },
      scope: $scope
    }).then(function(value){
      console.log("confirmed for - ", action, " value - ", value);
      $scope.repackDlgInputInfo(value);
      $http.post(action, $scope.postData).
        success(function(data, status, headers, config){
          showAlert('success', msg + "成功", 2000);
          $scope.setContent($scope.content);
        }).
        error(function(data, status, headers, config){
          console.log('failed -', status);
          if(!requireAuthenticate(status)) showAlert('danger', msg + "失败 - " + status, 4000);
        });
      
    },function(reason){
      //do nothing
    });
  };
  
  $scope.setRole = function(uri, templateUri, extraDataUri, actions, msg){
    $http.get(extraDataUri).
      success(function(data, status, headers, config){
        console.log("got data for - ", extraDataUri, " role's actions - ", actions);
        if(data != undefined && data.length > 0 && actions != undefined && actions.length > 0){
          for(var i = 0; i < data.length; i++){
            data[i].selected = (actions.indexOf(data[i].actionId) != -1);
          }
        }
        $scope.subdata = data;
      }).
      error(function(data, status, headers, config){
      });
      
    ngDialog.openConfirm({
      template: templateUri,
      className: 'ngdialog-theme-default',
      preCloseCallback: function(value){
        //TODO: notify user to confirm
        console.log('preCloseCallback - ', value);
        return true;
      },
      scope: $scope
    }).then(function(value){
      console.log("confirmed for - ", uri);
      console.log($scope.subdata);
      $scope.postData = {
        actions: []
      };
      for(var i = 0; i < $scope.subdata.length; i++){
        if($scope.subdata[i].selected == true){
          if($scope.postData.actions.indexOf($scope.subdata[i].actionId) == -1){
            $scope.postData.actions.push($scope.subdata[i].actionId);
            if($scope.subdata[i].parent != -1 && $scope.postData.actions.indexOf($scope.subdata[i].parent) == -1){
              $scope.postData.actions.push($scope.subdata[i].parent);
              console.log("push role's parent - ", $scope.subdata[i].parent);
            }
          }
        }
      }
      console.log($scope.postData);
      $http.post(uri, $scope.postData).
        success(function(data, status, headers, config){
          showAlert('success', msg + "成功", 2000);
          $scope.setContent($scope.content);
        }).
        error(function(data, status, headers, config){
          if(!requireAuthenticate(status))showAlert('danger', msg + "失败 - " + status, 4000);
        });
      
    },function(reason){
      //do nothing
    });  
  };
  
  $scope.validatePassword = function(id1, id2){
    var pwd = angular.element(document.querySelector(id1))[0];
    var pwd2 = angular.element(document.querySelector(id2))[0];
    $scope.passwordNotEqual = (pwd.value != pwd2.value);
  }
});