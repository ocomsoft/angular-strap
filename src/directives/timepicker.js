'use strict';

function UpdateDate(date, hours, minutes) {
	if (!angular.isDate(date)) 
		date = new Date();
		
    date.setHours(hours);
    date.setMinutes(minutes);
    
    return date;
}

function formatTimeForElement (modelValue) {
	if (angular.isDate(modelValue)) {
		var hours = modelValue.getHours();
		var meridian = "AM"
		if (hours > 12)  {
			meridian = "PM";
			hours = hours - 12;
		}
				
		var mins = modelValue.getMinutes() + "";
		
		while (mins.length < 2)
			mins = "0" + mins;
		
		var newValue = hours +":" + mins + " "+ meridian;
		
		console.log ("Set Control To: " + newValue);	
		
		return newValue;					
	}
	else {
			if (isNaN(modelValue)) 
				return "12:00 AM"
			else
				return modelValue + ""; // Try and use as is...
	}
}

angular.module('$strap.directives')

.directive('bsTimepicker', function($timeout, $strapConfig) {

  var TIME_REGEXP = '((?:(?:[0-1][0-9])|(?:[2][0-3])|(?:[0-9])):(?:[0-5][0-9])(?::[0-5][0-9])?(?:\\s?(?:am|AM|pm|PM))?)';

  return {
    restrict: 'A',
    require: '?ngModel',
    link: function postLink(scope, element, attrs, controller) {		
		
	  var type = attrs.dateType || 'date';
	  
	  var updatingFromModel = false;
    
	  // If we have a controller (i.e. ngModelController) then wire it up
    if(controller) {
			scope.$watch(function() {
					return controller.$modelValue;
				},
				function (modelValue) {
					if (angular.isDate(modelValue)) {
						$timeout(function() {
							updatingFromModel = true; // Semaphore to ensure not flipping
							$(element).timepicker('setTime', formatTimeForElement(modelValue));
							updatingFromModel = false;
						});
					}
			});									
			
			controller.$render = function() {
        if ( controller.$viewValue ) {
        	updatingFromModel = true; // Semaphore to ensure not flipping
        	$(element).timepicker('setTime', formatTimeForElement(controller.$viewValue));
        	updatingFromModel = false;           
        } else {
          // This occurs when signatureData is set to null in the main controller
          $(element).timepicker('setTime',"");
        }
      };
      
			var timeRegExp = new RegExp('^' + TIME_REGEXP + '$', ['i']);
			
			// viewValue -> $parsers -> modelValue
			controller.$parsers.unshift(function(viewValue) {
					if (type != "date") {
						if (!viewValue || timeRegExp.test(viewValue)) {
							controller.$setValidity('time', true);
							return viewValue;
						} else {
							controller.$setValidity('time', false);
							return;
						}
					}
					else {
						if(!viewValue) {
							controller.$setValidity('date', true);
							return null;
						} else if(type === 'date' && angular.isDate(viewValue)) {
							controller.$setValidity('date', true);
							return viewValue;
						} else {
							controller.$setValidity('date', false);
							return undefined;
						}
					}
			});
		}
	
	

      // Create timepicker
      element.attr('data-toggle', 'timepicker');
      element.parent().addClass('bootstrap-timepicker');
      element.timepicker($strapConfig.timepicker || {});
      var timepicker = element.data('timepicker');
           
      // Hook up Change Listener.
      element.on('changeTime.timepicker', function(ev) {
				if (updatingFromModel)
						return;  
					
				var currentValue = controller.$modelValue;
				
				$timeout(function() {
					var hours = ev.time.hours;
				
					if (ev.time.meridian === "PM") {
						hours = hours + 12;
					}
					
					var newDateValue = UpdateDate(currentValue, hours, ev.time.minutes);
					console.log ("Change time to: " + newDateValue);
					controller.$setViewValue(newDateValue);
				});
			}); 
			
      // Support add-on
      var component = element.siblings('[data-toggle="timepicker"]');
      if(component.length) {
        component.on('click', $.proxy(timepicker.showWidget, timepicker));
      }

    }
  };

});
