"use strict";
angular.module("manxBirdLifeApp", ['ui.bootstrap', 'ngSanitize', 'ngFileUpload', 'ngResource', 'blockUI', 'bootstrapLightbox','ngRoute']);


//define global configuration settings here
angular.module("manxBirdLifeApp")
    .constant('configSettings', 
               { MBLWebApiUrl : 'http://mblapi.20westbourne.com/' }
            );

angular.module("manxBirdLifeApp").config(function($locationProvider) {
    $locationProvider.html5Mode({
  enabled: true,
  requireBase: false,
  rewriteLinks: false
});
    $locationProvider.hashPrefix('');
});

angular.module("manxBirdLifeApp").filter('unsafe', function ($sce) {
    return function (val) {
        return $sce.trustAsHtml(val);
    };
});

angular.module("manxBirdLifeApp")
    .config(['$uibTooltipProvider','blockUIConfig', function ($uibTooltipProvider, blockUIConfig) {
        $uibTooltipProvider.options({ placement: 'top' });
        blockUIConfig.autoInjectBodyBlock = false;
        blockUIConfig.message = "Please wait ....";
    }]);

//Signting input form controller
angular.module("manxBirdLifeApp")
    .controller("formController", ['$scope', 'species', 'location', 'sightUser', 'sightDetails', '$http', 'blockUI', '$timeout', 'Upload','$window', 'configSettings',
        function ($scope, species, location, sightUser, sightDetails, $http, blockUI, $timeout, Upload, $window, configSettings) {

            $scope.dateOptions = {
                maxDate: new Date(),
                showWeeks: false,
                datepickerMode:'day' 
            };

            $scope.formats = ['dd MMM yy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
            $scope.format = $scope.formats[0];
            $scope.altInputFormats = ['M!/d!/yyyy'];

            $scope.speciesArray = species.query();
            $scope.locationArray = location.query();
			
			$scope.approxArray = ['=', 'c.', '+'];

            //new species info
            function speciesInfo() {
                this.speciesSelected ='',
                this.speciesnumber='',
                this.approximation=$scope.approxArray[0],
                this.details='',
                this.dropFile = '',
                this.SpeciesTabOpen = false,
                this.chkSensitiveDoNotDisplay = false
                this.formatSpeciesLabel = function(model) {
                    var matchFound = false;
                    for (var i=0; i< $scope.speciesArray.length; i++) {
                        if (model === $scope.speciesArray[i].ID) {
                            matchFound = true;
                            return $scope.speciesArray[i].Name;
                        }
                    }
                    if (!matchFound) {
                        return model;
                    }
                }
            }
			
			//set timepicker to 00:00
			var defaultTime = new Date();
			defaultTime.setHours(0);
			defaultTime.setMinutes(0);
			
            //new sightingInfo fields
            function sightingInfo() {

                this.locationSelected ='',
                this.gridReference='',
                this.dt= new Date(),
                this.myTime = defaultTime,
                this.speciesSightingArray = [],
                this.calendarOpened = false,
                this.TabOpen = true,
                this.openCalendar = function () {
                    this.calendarOpened = true;
                },
                this.formatLocationLabel = function(model) {
                    var matchFound = false;
                    for (var i=0; i< $scope.locationArray.length; i++) {
                        if (model === $scope.locationArray[i].ID) {
                            matchFound = true;
                            return $scope.locationArray[i].Name;
                        }
                    }
                    if (!matchFound) {
                        return model;
                    }
                },
                this.onSelect = function($item, $model, $value) {
                    this.gridReference = $item.GridRef;

                },
                this.Clear = function() {
                    this.gridReference = '';
                },
                this.addSpeciesSighting = function(e)
                {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }

                    this.speciesSightingArray.push(new speciesInfo());
                },
                this.removeSpeciesSighting = function(pos,e) {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }

                    if (pos > -1) {
                        this.speciesSightingArray.splice(pos, 1);
                    }
                }

                this.speciesSightingArray.push(new speciesInfo());
            }

            $scope.data = {};
			
            //array to hold sighting information
            $scope.data.sightingsArray =  [];

            //add one sighting to start with
            $scope.data.sightingsArray.push(new sightingInfo());

            $scope.showAddButton = true;

            //add more sighting
            $scope.addSighting = function(e) {

                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                $scope.data.sightingsArray.push(new sightingInfo());
                //allow to add a maximum of 5 sighting
                if ($scope.data.sightingsArray.length >= 5 ) {
                    $scope.showAddButton = false;
                }
            };

            //remove current sighting
            $scope.removeSighting = function(pos,e) {

                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                if (pos > -1) {
                    $scope.data.sightingsArray.splice(pos, 1);
                }
                if ($scope.data.sightingsArray.length < 5 ) {
                    $scope.showAddButton = true;
                }
            };

            $scope.uploadNow = function() {

                // Block the user interface
                blockUI.start("Saving sight information, please wait ...");

                sightUser.save({
                                SightingUserId:0,
                                Name: $scope.data.userName,
                                Email: $scope.data.userEmail,
                                boolKeepAnonymous: $scope.data.chkKeepAnonymous,
                                boolPermissionToContact : $scope.data.chkPermissionToContact
                        })
                        .$promise.then(function(user) {
                                                    
                                console.log(user);
                                //$window.alert("added user, now adding sight location.");
                                angular.forEach($scope.data.sightingsArray, function(value, key) {

                                        var currentSight = $scope.data.sightingsArray[key];
                                        currentSight.sightReportUserID = user.SightReportUserID;
                                        
                                        sightDetails.save ({
                                            sightReportUserID: user.SightReportUserID,
                                            locationSelected: currentSight.locationSelected,//value.locationSelected,
                                            gridReference: currentSight.gridReference, //value.gridReference,
                                            dt: currentSight.dt,//value.dt,
                                            myTime: currentSight.myTime//value.myTime
                                        })
                                        .$promise.then(function(sight) {
                                            
                                                angular.forEach(currentSight.speciesSightingArray, function(speciesValue, key) {
                                                            
                                                        speciesValue.SightDetailsID = sight.SightDetailsID;
                                                        console.log(speciesValue);
                                                        //upload all sightings info to web api
                                                        Upload.upload({                                                            
                                                            url: configSettings.MBLWebApiUrl + "/api/SpeciesSightingDetails",
                                                            method: "POST",
                                                            data: { fileUploadObj: JSON.stringify(speciesValue) },
                                                            file: speciesValue.dropFile
                                                        }).success(function (data, status, headers, config) {
                                                            // file is uploaded successfully
                                                            console.log(data);
                                                        }).error(function (data, status, headers, config) {
                                                            // file failed to upload
                                                            console.log(data);
                                                        })

                                                }); //END OF ANGULAR.FOREACH FOR SPECIES
                                            
                                                //reset form after submit
                                                if ($scope.data.submittedOK)
                                                {   
                                                    $scope.data = {};
                                                    $scope.data.submittedOKAdminApprovalNeeded = false;
                                                    $scope.data.submittedOK = true;
                                                    $scope.data.submittedError = false;
                                                    $scope.data.sightingsArray = [];
                                                    $scope.data.sightingsArray.push(new sightingInfo());
                                                    
                                                    $scope.sightForm.$setPristine();
                                                    $scope.sightForm.$setUntouched();
                                                    
                                                }
                                        })
                                        .catch(function (error) {
                                                //console.log(error.message);
                                                console.log(error.data);
                                                $scope.data.submittedError = true;
                                                $scope.data.submittedOK = false;
                                        });

                                    
                                }); //END OF ANGULAR.FOREACH FOR SIGHTING

                                var adminApprovalNeeded = $scope.checkIfAdminApprovalNeeded();
                                $scope.data.submittedOKAdminApprovalNeeded = adminApprovalNeeded;
                                $scope.data.submittedOK = !adminApprovalNeeded;
                                //$scope.data.submittedOK = true;
                                $scope.data.submittedError = false;

                        })
                        .catch(function(res){
                            console.log(res.data);
                            $scope.data.submittedError = true;
                            $scope.data.submittedOK = false;
                        });
            

                blockUI.stop();
                //$window.scrollTo(0, 0);
                $window.pageYOffset = -200;
            };

            $scope.checkIfAdminApprovalNeeded = function() {

                var boolAdminApprovalNeeded = false;
                sightingLoop: for (var i = 0; i < $scope.data.sightingsArray.length; i++) {
                    if (!boolAdminApprovalNeeded)
                    var currentSight = $scope.data.sightingsArray[i];
                    if (currentSight.locationSelected === '') {
                        boolAdminApprovalNeeded = true;
                        break;
                    }

                    speicesSightingLoop: for (var sp = 0; sp < currentSight.speciesSightingArray.length; sp++) {
                        var currentSpecies = currentSight.speciesSightingArray[sp];
                         if (currentSpecies.speciesSelected === '') {
                            boolAdminApprovalNeeded = true;
                            break sightingLoop;
                        }
                    }
                }
                return boolAdminApprovalNeeded;
            };

        }]);


//Gallery Controller
angular.module("manxBirdLifeApp")
    .controller("galleryController", ['$scope', '$http', 'blockUI', '$timeout', 'gallery', 'Lightbox', 'configSettings',
        function($scope, $http, blockUI, $timeout, gallery, Lightbox, configSettings) {
            
            $scope.paging = {};

            //get list of all uploaded files
            gallery.query().$promise.then(function(result){

                $scope.images = result;

                angular.forEach($scope.images, function(value, key) {
                    var currentImage = $scope.images[key];
                    if (currentImage.thumbUrl.indexOf(configSettings.MBLWebApiUrl + '/FileUploads/') === -1)
                        currentImage.thumbUrl = configSettings.MBLWebApiUrl + '/FileUploads/' + currentImage.thumbUrl;

                    if (currentImage.url.indexOf(configSettings.MBLWebApiUrl + '/FileUploads/') === -1)
                        currentImage.url = configSettings.MBLWebApiUrl + '/FileUploads/' + currentImage.url;

                    $scope.images[key] = currentImage;
                });


                $scope.paging.viewby ="50";
                $scope.paging.totalItems = $scope.images.length;
                $scope.paging.currentPage = 1;
                $scope.paging.itemsPerPage = $scope.paging.viewby;
            
                $scope.setItemsPerPage = function(num) {
                  $scope.paging.itemsPerPage = num;
                  $scope.paging.currentPage = 1; //reset to first page
                }

            });
            
            $scope.openLightboxModal = function (index) {
                Lightbox.openModal($scope.images, index);
            };
        }]);

//thumbnail for gallery 
angular.module("manxBirdLifeApp")
    .directive("thumbnailGeneratorDirective", function($timeout) {
        return{
            restrict:"A",
            link:function(scope, elem, attrs) {
                $timeout(function(){
                    jQuery(elem).nailthumb({width:250,height:250,fitDirection:'center center'});
                });                
            }
        }
    });

//Noticeboard controller
angular.module("manxBirdLifeApp")
	.controller("noticeBoardController", ['$scope', '$http', 'blockUI', '$timeout', 'noticeBoard', '$uibModal',
		function($scope, $http, blockUI, $timeout, noticeBoard, $uibModal) {
			
            $scope.paging = {};

            //get list of sightings
            var result = noticeBoard.query().$promise.then(function(sights){
                $scope.sightList = sights.filter(function(i) {
                                return $scope.CanDisplayRecord(i);
                                //return !i.boolNeedApproval && !i.boolSpeciesWithinSensitiveDateRange && !i.boolOverrideSensitiveSpeciesRecord;
                            });

                $scope.paging.viewby ="50";
                $scope.paging.totalItems = $scope.sightList.length;
                $scope.paging.currentPage = 1;
                $scope.paging.itemsPerPage = $scope.paging.viewby;
            
                $scope.setItemsPerPage = function(num) {
                  $scope.paging.itemsPerPage = num;
                  $scope.paging.currentPage = 1; //reset to first page
                }
            });			
			
			angular.forEach($scope.sightList, function(value, key) {
				value.rowExpanded = false;				
			});
			
            $scope.CanDisplayRecord = function(sight) {
                var showRecord = true;

                if (sight.boolNeedApproval) {
                    return false;
                }

                if (sight.boolSpeciesWithinSensitiveDateRange) { //never display species if it was spotted within a sensitive date range
                    return false;
                }

                if (sight.boolOverrideSensitiveSpeciesRecord) { //this boolean flag takes care of both user selected & admin overriden 'do not display'
                    return false;
                }

                return showRecord;
            };

			//show details row
			$scope.ShowSightDetails=function(sight){
					
					//set previous clicked row expanded to false
					angular.forEach($scope.sightList, function(value, key) {
						 if (value === $scope.selected_sight && sight !== $scope.selected_sight) {
							value.rowExpanded = false;
						}
					});
						
					sight.rowExpanded = !sight.rowExpanded;
										
					$scope.selected_sight=sight;
			};
						
			$scope.isSelected=function(sight){
				return $scope.selected_sight===sight;
			};
						
			
			//Sort			
			$scope.reverse = false;
			$scope.propertyName = ['-SightDate','-SightTime','SpeciesName', 'LocationName','Observer'];
			$scope.SortBy = function(column) {
				$scope.propertyName = column;
				$scope.reverse = !$scope.reverse;
			}
			
			$scope.openModalDialog = function (currentSight) {

				var modalInstance = $uibModal.open({
				  animation:true,
				  ariaLabelledBy: 'modal-title',
				  ariaDescribedBy: 'modal-body',
				  templateUrl: 'myModalContent.html',
				  controller: 'ModalInstanceCtrl',
				  size: 'md',
				  resolve: {
					sight: function() {
						return currentSight;
					}
				  }
				});
			}

            $scope.EditSighting = function (currentSight) {

                var modalInstance = $uibModal.open({
                  animation:true,
                  ariaLabelledBy: 'modal-title',
                  ariaDescribedBy: 'modal-body',
                  templateUrl: 'EditSighting.html',
                  controller: 'ModalEditSightingCtrl',
                  size: 'lg',
                  resolve: {
                    sight: function() {
                        return currentSight;
                    }
                  }
                });
            }



		}]);

//Adming sight Listing (noticeboard)
angular.module("manxBirdLifeApp")
    .controller("AdminSightingController", ['$scope', '$http', 'blockUI', '$timeout', 'noticeBoard', '$uibModal', 'species','location', '$rootScope', '$location', '$window',
        function($scope, $http, blockUI, $timeout, noticeBoard, $uibModal, species, location, $rootScope, $location, $window) {
            
            var queryParams = $location.search();           

            if (queryParams.Token == undefined) {
                $window.location.href = '/login-administration';
            }

            var decodeToken =  Base64.decode(queryParams.Token);
            if (!decodeToken.includes(":")) {
                $window.location.href = '/login-administration';   
            }

            var tempDecoded = decodeToken.split(":");

            if (tempDecoded.length != 3 ) {
                $window.location.href = '/login-administration';   
            }

            var user = tempDecoded[1].toLowerCase();
            var pwd = tempDecoded[2];

            if (user !== "admin" || pwd !== "B7qKnke8eAuMjVbL") {
                $window.location.href = '/login-administration';   
            }

                        
            var sights = [];

            $scope.paging = {};
            $scope.filtered = {};

            //get list of sightings
            noticeBoard.query().$promise.then(function(result) {
                sights = result;
                $scope.sightList = sights;
                angular.forEach($scope.sightList, function(value, key) {
                    value.rowExpanded = false;                                                    
                });

                $scope.paging.viewby ="50";
                $scope.paging.totalItems = $scope.sightList.length;
                $scope.paging.currentPage = 1;
                $scope.paging.itemsPerPage = $scope.paging.viewby;
            
                $scope.setItemsPerPage = function(num) {
                  $scope.paging.itemsPerPage = num;
                  $scope.paging.currentPage = 1; //reset to first page
                }

            });           

            $scope.speciesArray = species.query();
            $scope.locationArray = location.query();      
            
            $scope.boolShowOnlySensitive = undefined;        
            
            $scope.filterSensitive = function (item) {
                if ($scope.boolShowOnlySensitive) {
                    return item.boolOverrideSensitiveSpeciesRecord || item.boolSpeciesWithinSensitiveDateRange;
                }
                return true;

            }

            //show details row
            $scope.ShowSightDetails=function(sight) {
                //set previous clicked row expanded to false
                angular.forEach($scope.sightList, function(value, key) {
                     if (value === $scope.selected_sight && sight !== $scope.selected_sight) {
                        value.rowExpanded = false;
                    }
                });
                    
                sight.rowExpanded = !sight.rowExpanded;                                        
                $scope.selected_sight=sight;
            };
                        
            $scope.isSelected=function(sight){
                return $scope.selected_sight===sight;
            };                        
            
            //Sort          
            $scope.reverse = false;
            $scope.propertyName = ['-SightDate','-SightTime','SpeciesName', 'LocationName','Observer'];
            $scope.SortBy = function(column) {
                $scope.propertyName = column;
                $scope.reverse = !$scope.reverse;
            }
            
            $scope.openModalDialog = function (currentSight) {

                var modalInstance = $uibModal.open({
                  animation:true,
                  ariaLabelledBy: 'modal-title',
                  ariaDescribedBy: 'modal-body',
                  templateUrl: 'myModalContent.html',
                  controller: 'ModalInstanceCtrl',
                  size: 'lg',
                  resolve: {
                    sight: function() {
                        return currentSight;
                    }
                  }
                }).result.catch(function(res) {
                                  if (!(res === 'cancel' || res === 'escape key press' || res === 'backdrop click')) {
                                    throw res;
                                  }
                                });
            }

            $scope.closeAlert = function(index) {
                    $scope.submittedOK = false;
                    $scope.submittedError = false;
                };

            $scope.EditSighting = function (currentSight) {

                $scope.submittedOK = false;
                $scope.submittedError = false;
                
                var modalInstance = $uibModal.open({
                  animation:true,
                  ariaLabelledBy: 'modal-title',
                  ariaDescribedBy: 'modal-body',
                  templateUrl: 'EditSighting.html',
                  controller: 'ModalEditSightingCtrl',
                  size: 'lg',
                  resolve: {
                    sight: function() {
                        return currentSight;
                    },
                    speciesArray : function() {
                        return $scope.speciesArray;
                    },
                    locationArray : function() {
                        return $scope.locationArray;
                    }

                  }
                })
                .result.then(function(sight1) {

                    angular.forEach($scope.sightList, function(value, key) {

                        var tempSight = $scope.sightList[key];

                        if (tempSight.SpeciesSightingDetailsID === sight1.SpeciesSightingDetailsID)
                        {
                            //var tempSightDate = tempSight.SightDate;
                            $scope.sightList[key] = sight1;
                            $scope.selected_sight = sight1;
                            //$scope.sightList[key].SightDate = tempSightDate;                                  
                        }
                    });

                    //Successfully saved
                    $scope.submittedOK = true;
                    $scope.submittedError = false;
                    
                }, function(res) {
                  if ((res === 'cancel' || res === 'escape key press' || res === 'backdrop click')) {
                    throw res;
                  }

                  $scope.submittedOK = false;
                  $scope.submittedError = true;

                });

                
            }



        }]);

angular.module('manxBirdLifeApp').filter('start', function () {
  return function (input, start) {
    if (!input || !input.length) { return; }
    start = +start;
    return input.slice(start);
  };
});

//noticeboard - open modal pop up contoller
angular.module('manxBirdLifeApp')
    .controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, sight, configSettings) {  
  
  $scope.currentSight = sight;
  
  if ($scope.currentSight.ImagePath.indexOf(configSettings.MBLWebApiUrl + '/FileUploads/') === -1)
	$scope.currentSight.ImagePath = configSettings.MBLWebApiUrl + '/FileUploads/' + $scope.currentSight.ImagePath;
 
  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});


angular.module('manxBirdLifeApp')
    .controller('ModalEditSightingCtrl',  function ($scope, $uibModalInstance, sight, speciesArray, 
        locationArray, $filter, blockUI, AdminSightListing, uibDateParser) {  
  
    $scope.dateOptions = {
        maxDate: new Date(),
        showWeeks: false,
        datepickerMode:'day' 
    };

    $scope.formats = ['dd MMM yy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.currentSight = angular.copy(sight);
    $scope.speciesArray = speciesArray;
    $scope.locationArray = locationArray;
    var convertedDate = $filter('date')($scope.currentSight.SightDate, 'dd MMM yy');
    $scope.currentSight.SightDate = uibDateParser.parse(convertedDate, 'dd MMM yy');
    
    var dat = new Date, time = $scope.currentSight.SightTime.split(/\:|\-/g);
    dat.setHours(time[0]);
    dat.setMinutes(time[1]);

    $scope.currentSight.SightTime = dat;

    $scope.currentSight.calendarOpened = false;
    $scope.openCalendar = function(){
        $scope.currentSight.calendarOpened = true;
    }   

    $scope.formatLocationLabel = function(model) {
        var matchFound = false;
        for (var i=0; i< $scope.locationArray.length; i++) {
            if (model === $scope.locationArray[i].ID) {
                matchFound = true;
                return $scope.locationArray[i].Name;
            }
        }
        if (!matchFound) {
            return model;
        }
    }  

    $scope.onLocationSelect = function($item, $model, $value) {
        $scope.currentSight.LocationID = $item.ID;
        $scope.currentSight.LocationName = $item.Name;
        $scope.currentSight.GridRef = $item.GridRef;
    }

    $scope.Clear = function() {
        $scope.currentSight.GridRef = '';
    }

    $scope.formatSpeciesLabel = function(model) {
        var matchFound = false;
        for (var i=0; i< $scope.speciesArray.length; i++) {
            if (model === $scope.speciesArray[i].ID) {
                matchFound = true;
                return $scope.speciesArray[i].Name;
            }
        }
        if (!matchFound) {
            return model;
        }
    }

    $scope.onSpeciesSelect = function($item, $model, $value) {
        $scope.currentSight.SpeciesID = $item.ID;
        $scope.currentSight.SpeciesName = $item.Name;
    }   

    $scope.cancelChanges = function () {
        $uibModalInstance.dismiss('cancel');        
    };

    $scope.submitChanges = function () {

        $scope.submittedError = false;

        blockUI.start("Saving sight information, please wait ...");

        AdminSightListing.save({
            SightDetailsID : $scope.currentSight.SightDetailsID,
            LocationID: $scope.currentSight.LocationID,
            LocationName: $scope.currentSight.LocationName,
            SpeciesID: $scope.currentSight.SpeciesID,
            SpeciesName: $scope.currentSight.SpeciesName,
            Details: $scope.currentSight.Details,
            boolOverrideSensitiveSpeciesRecord: $scope.currentSight.boolOverrideSensitiveSpeciesRecord,
            GridRef: $scope.currentSight.GridRef,
            SightDate: $scope.currentSight.SightDate,
            SightTime: $scope.currentSight.SightTime
        })
        .$promise.then(function() {

            $scope.currentSight.SightDate = $scope.currentSight.SightDate.toISOString();
            $scope.currentSight.SightTime = $scope.currentSight.SightTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});

            sight = $scope.currentSight;
            sight.boolNeedApproval = false;
            sight.boolNewUnApprovedSpeciesName = false;
            sight.boolNewUnApprovedLocationName = false;

            $uibModalInstance.close(sight); 

        })
        .catch(function(res){
            $scope.submittedError = true;
            console.log("error: " + res.data);                            
        });

        blockUI.stop();


    };

});

//resource factory for Location lookup
angular.module("manxBirdLifeApp")
    .factory("location", ["$resource", 'configSettings', function($resource, configSettings) {
        return 	$resource(configSettings.MBLWebApiUrl + '/api/Location/:id', {id: "@id"});
    }]);		
		
//resource factory for ReportUser
angular.module("manxBirdLifeApp")
    .factory("sightUser", ["$resource", 'configSettings', function($resource, configSettings) {
        return 	$resource(configSettings.MBLWebApiUrl + '/api/SightReportUser/:id', {id: "@id"});
    }]);

//resource factory for Sight
angular.module("manxBirdLifeApp")
    .factory("sightDetails", ["$resource", 'configSettings', function($resource, configSettings) {
        return 	$resource(configSettings.MBLWebApiUrl + '/api/SightDetails/:id', {id: "@id"});
    }]);

//resource factory for Species lookup
angular.module("manxBirdLifeApp")
    .factory("species", ["$resource", 'configSettings', function($resource, configSettings) {
        return 	$resource(configSettings.MBLWebApiUrl + '/api/Species/:id', {id: "@id"});
    }]);

//resource factory for Noticeboard
angular.module("manxBirdLifeApp")
    .factory("noticeBoard", ["$resource", 'configSettings', function($resource, configSettings) {
        return 	$resource(configSettings.MBLWebApiUrl + '/api/NoticeBoard/:id', {id: "@id"});
    }]);

//resource factory for Admin sight listing
angular.module("manxBirdLifeApp")
    .factory("AdminSightListing", ["$resource", 'configSettings', function($resource, configSettings) {
        return  $resource(configSettings.MBLWebApiUrl + '/api/AdminSightListing/:id', {id: "@id"});
    }]);

//login resource
angular.module("manxBirdLifeApp")
    .factory("LoginService", ["$resource", 'configSettings', function($resource, configSettings) {
        return  $resource(configSettings.MBLWebApiUrl + '/api/Login', {}, {
            CheckUser : {method:"POST"}
        });
    }]);

//resource factory for gettting sightings images (gallery)
angular.module("manxBirdLifeApp")
    .factory("gallery", ["$resource", 'configSettings', function($resource, configSettings) {
        return  $resource(configSettings.MBLWebApiUrl + '/api/SightUploadFile/:id', {id: "@id"});
    }]);


angular.module('manxBirdLifeApp')
        .factory('FlashService', FlashService);

FlashService.$inject = ['$rootScope'];
function FlashService($rootScope) {
    var service = {};

    service.Success = Success;
    service.Error = Error;

    initService();

    return service;

    function initService() {
        $rootScope.$on('$locationChangeStart', function () {
            clearFlashMessage();
        });

        function clearFlashMessage() {
            var flash = $rootScope.flash;
            if (flash) {
                if (!flash.keepAfterLocationChange) {
                    delete $rootScope.flash;
                } else {
                    // only keep for a single location change
                    flash.keepAfterLocationChange = false;
                }
            }
        }
    }

    function Success(message, keepAfterLocationChange) {
        $rootScope.flash = {
            message: message,
            type: 'success', 
            keepAfterLocationChange: keepAfterLocationChange
        };
    }

    function Error(message, keepAfterLocationChange) {
        $rootScope.flash = {
            message: message,
            type: 'error',
            keepAfterLocationChange: keepAfterLocationChange
        };
    }
}

angular.module('manxBirdLifeApp')
    .factory('AuthenticationService', AuthenticationService);

AuthenticationService.$inject = ['$http', '$rootScope', '$timeout','LoginService', "$resource", 'configSettings'];
function AuthenticationService($http, $rootScope, $timeout, LoginService, $resource, configSettings) {
    var service = {};

    service.Login = Login;
    service.SetCredentials = SetCredentials;
    service.ClearCredentials = ClearCredentials;
     
    return service;

    function Login(username, password, callback) {

        /* Use this for real authentication
         ----------------------------------------------*/
        LoginService.CheckUser({ UserName: username, Password: password }).$promise.then(function (response) {
           callback(response);
            }, function(error) {
                console.log(error.data);
        });

    }

    function SetCredentials(username, password) {
        //var authdata = Base64.encode(username + ':' + password);

        /*$rootScope.globals = {
            currentUser: {
                username: username,
                authdata: authdata
            }
        };*/

        // set default auth header for http requests
        //$http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;

        // store user details in globals cookie that keeps user logged in for 1 week (or until they logout)
        //var cookieExp = new Date();
        //cookieExp.setDate(cookieExp.getDate() + 7);
        //$cookies.putObject('globals', $rootScope.globals, { expires: cookieExp });
    }

    function ClearCredentials() {
        $rootScope.globals = {};
        //$cookies.remove('globals');
        //$http.defaults.headers.common.Authorization = 'Basic';
    }
}

// Base64 encoding service used by AuthenticationService
var Base64 = {

    keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

    encode: function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this.keyStr.charAt(enc1) +
                this.keyStr.charAt(enc2) +
                this.keyStr.charAt(enc3) +
                this.keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);

        return output;
    },

    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        var base64test = /[^A-Za-z0-9\+\/\=]/g;
        if (base64test.exec(input)) {
            window.alert("There were invalid base64 characters in the input text.\n" +
                "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                "Expect errors in decoding.");
        }
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        do {
            enc1 = this.keyStr.indexOf(input.charAt(i++));
            enc2 = this.keyStr.indexOf(input.charAt(i++));
            enc3 = this.keyStr.indexOf(input.charAt(i++));
            enc4 = this.keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";

        } while (i < input.length);

        return output;
    }
};

angular
    .module('manxBirdLifeApp')
    .controller('LoginController', LoginController);

LoginController.$inject = ['$location', 'AuthenticationService', 'FlashService','$window'];
function LoginController($location, AuthenticationService, FlashService, $window) {
    var vm = this;

    vm.login = login;

    (function initController() {
        // reset login status
        AuthenticationService.ClearCredentials();
    })();

    function login() {
        vm.dataLoading = true;
        AuthenticationService.Login(vm.username, vm.password, function (response) {
            if (response.success) {
                AuthenticationService.SetCredentials(vm.username, vm.password);    
                var AuthToken = Base64.encode(Math.random() + ':' + vm.username + ':' + vm.password);
                $window.location.href = '/sightings-administration?Token=' + AuthToken; //'/Admin-SightListing';
            } else {
                FlashService.Error(response.message);
                vm.dataLoading = false;
            }
        });
    };
}
