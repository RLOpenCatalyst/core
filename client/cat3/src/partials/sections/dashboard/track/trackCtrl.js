(function (angular) {
	angular.module('dashboard.track', [])
	.controller('trackCtrl',['$scope','$firebase', function ($scope,$firebase) {

		// get # of real time users
		var listRef = new Firebase("https://burning-torch-4263.firebaseio.com/presence/");
		var userRef = listRef.push();

		// Add ourselves to presence list when online.
		var presenceRef = new Firebase("https://burning-torch-4263.firebaseio.com/.info/connected");
		presenceRef.on("value", function(snap) {
			if (snap.val()) {
				userRef.set(true);
				// Remove ourselves when we disconnect.
				userRef.onDisconnect().remove();
			}
		});

		listRef.on("value", function(snap) {
			$scope.online = snap.numChildren();
		});

		var ref = new Firebase("https://burning-torch-4263.firebaseio.com/days");
		var fb = $firebase(ref);

		// three way data binding
		var syncObject = fb.$asObject();
		syncObject.$bindTo($scope, 'days');

		$scope.reset = function() {
			fb.$set({
				monday: {
					name: 'Monday',
					slots: {
						0900: {
							time: '9:00am',
							booked: false
						},
						0110: {
							time: '11:00am',
							booked: false
						},
						100: {
							time: '1:00pm',
							booked: false
						},
						300: {
							time: '3:00pm',
							booked: false
						},
						500: {
							time: '5:00pm',
							booked: false
						},
						700: {
							time: '7:00pm',
							booked: false
						}
					}
				},
				tuesday: {
					name: 'Tuesday',
					slots: {
						0900: {
							time: '9:00am',
							booked: false
						},
						0110: {
							time: '11:00am',
							booked: false
						},
						100: {
							time: '1:00pm',
							booked: false
						},
						300: {
							time: '3:00pm',
							booked: false
						},
						500: {
							time: '5:00pm',
							booked: false
						},
						700: {
							time: '7:00pm',
							booked: false
						}
					}
				},
				wednesday: {
					name: 'Wednesday',
					slots: {
						0900: {
							time: '9:00am',
							booked: false
						},
						0110: {
							time: '11:00am',
							booked: false
						},
						100: {
							time: '1:00pm',
							booked: false
						},
						300: {
							time: '3:00pm',
							booked: false
						},
						500: {
							time: '5:00pm',
							booked: false
						},
						700: {
							time: '7:00pm',
							booked: false
						}
					}
				}
			});
		};

	}]);

})(angular);