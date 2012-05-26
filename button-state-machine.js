// Description: ButtonStateMachine Plugin - see description in code comments below
// Author     : Heiko W. Risser
// Created    : May 2012
// SourceLink : 
// Revision   : 1.0
// 
// Todo       : - handle zIndex and option to prevent click from being sent to next entity on entity hit 
//            : 	this code should probably go somewhere else though.

ig.module (
	'plugins.button-state-machine'
)
.requires (
	//'impact.impact',
	'impact.entity'
)
.defines( function () {

	ig.INPUTSTATE = {								// nb: name needs to match property since we use name to access state table properties
		DISABLED: 		{ value: 0, name: 'DISABLED' },
		ENABLED: 		{ value: 1, name: 'ENABLED' },
		MOUSEIN: 		{ value: 2, name: 'MOUSEIN' },
		MOUSEOUT: 		{ value: 3, name: 'MOUSEOUT' },
		MOUSEINDOWN: 	{ value: 4, name: 'MOUSEINDOWN' },
		MOUSEOUTDOWN: 	{ value: 5, name: 'MOUSEOUTDOWN' },
		MOUSEINUP: 		{ value: 6, name: 'MOUSEINUP' },
		MOUSEOUTUP: 	{ value: 7, name: 'MOUSEOUTUP' },
		INVALID: 		{ value: 255, name: 'INVALID' }
	};
	ig.BUTTONSTATE = {
		IGNORE:			{ value: 0, name: 'IGNORE' },
		DISABLED:		{ value: 1, name: 'DISABLED' },
		OUTSIDE:		{ value: 2, name: 'OUTSIDE' },
		INSIDE:			{ value: 3, name: 'INSIDE' },
		INSIDEACTIVE:	{ value: 4, name: 'INSIDEACTIVE' }
	};
	
	
	// =================================================================================================================
	// ButtonStateMachine
	//
	// - create instance of ButtonStateMachine in your button class
	// - set the following button state input functions in your class (if required, else keep defaults)
	//		isMouseInside	- return true if mouse is inside of button clickable area, else false
	//		isEnabled		- return enabled state of your button, or keep default if your button can't be disabled
	//		isMouseDown		- return true if mouse.STATE is down, else false (note mouse state should return down continuosly
	//					  	  until button up, not just once on transition)
	// - set the following state transition handlers - if required
	//	 Note: these events on get called ONCE on state transition.
	//		startHover 		- notifies when mouse over clickable area
	//		endHover 		- notifies when mouse leaves clickable area
	//		startClick 		- notifies when mouse button down on clickable area
	//		endClick		- notifies when mouse button up on clickable area
	//		endClick		- notifies when mouse button up outside of clickable area
	// - call updateState() in your button class's update handler
	
	ig.ButtonStateMachine = ig.Class.extend({
		stateTable: null,
		currentState: null,
		mouseIsActive: false,
		lastInputState: ig.INPUTSTATE.INVALID,
		
		init: function(stateTable) {
			this.stateTable = stateTable || ig.ButtonStateMachine.stateTable;
			this.currentState = ig.BUTTONSTATE.OUTSIDE;
		},
		updateState: function() {
			
			var inputState = ig.INPUTSTATE.INVALID;
			
			if (!this.isEnabled()) {
				inputState = ig.INPUTSTATE.DISABLED;
			} else if (this.isMouseInside()) {
				inputState = ig.INPUTSTATE.MOUSEIN;
				if (this.isMouseDown()) {
					if (!this.mouseIsActive){
						this.mouseIsActive = true;
						inputState = ig.INPUTSTATE.MOUSEINDOWN;
					}
				} else if (this.mouseIsActive) {
					this.mouseIsActive = false;
					inputState = ig.INPUTSTATE.MOUSEINUP;
				}
			} else {
				inputState = ig.INPUTSTATE.MOUSEOUT;
				if (this.isMouseDown()) {
					if (!this.mouseIsActive){
						this.mouseIsActive = true;
						inputState = ig.INPUTSTATE.MOUSEOUTDOWN;
					}
				} else if (this.mouseIsActive) {
					this.mouseIsActive = false;
					inputState = ig.INPUTSTATE.MOUSEOUTUP;
				}
			}
			
			// only update state if we have a change in input
			if (inputState.value !== this.lastInputState.value)
			{
				var stateFunc = null;						// called on state transition (if valid function configured)
				var newState = null;
				
				this.lastInputState = inputState;
				
				var stateDef = this.stateTable[this.currentState.name][inputState.name];
				if (!stateDef)
					return false;
				
				// get output state for given input state, and if valid, then set new button state
				newState = stateDef[0];
				if (this.isValidButtonState(newState))
					this.currentState = newState;
				else
					return false;
				
				// get state transition function (if specified)
				stateFunc = this[stateDef[1]];
				if (stateFunc && typeof(stateFunc) === 'function') {
					stateFunc();
				}
			}
			return true;
		},
		
		// validate that 'state' is a valid button state.
		// note: for ig.BUTTONSTATE.IGNORE we return false, since we want to 'ignore' this state
		isValidButtonState: function(state) {
			if (/*(state === ig.BUTTONSTATE.IGNORE) ||*/
				(state === ig.BUTTONSTATE.DISABLED) ||
				(state === ig.BUTTONSTATE.OUTSIDE) ||
				(state === ig.BUTTONSTATE.INSIDE) ||
				(state === ig.BUTTONSTATE.INSIDEACTIVE))
				return true;
			else
				return false;
		},
		
		// State Inputs
		isMouseInside: function() { return false; },
		isEnabled: function() { return true; },
		isMouseDown: function () { return false; },
		
		// Events Out
		noEvent: null,
		startHover: null,
		endHover: null,
		startClick: null,
		endClick: null,
		endClickIgnore: null
	});
	
	
	ig.ButtonStateMachine.stateTable = {
		// Current buttonState
		OUTSIDE: {
			// inputState.name		Output buttonState			Output Event
			DISABLED: 			[ig.BUTTONSTATE.DISABLED, 		'noEvent'],
			MOUSEIN: 			[ig.BUTTONSTATE.INSIDE, 		'startHover'],
			MOUSEOUT: 			[ig.BUTTONSTATE.IGNORE, 		'noEvent'],
			MOUSEINDOWN: 		[ig.BUTTONSTATE.INSIDEACTIVE, 	'startClick'],
			MOUSEOUTDOWN: 		[ig.BUTTONSTATE.IGNORE, 		'noEvent'],
			MOUSEINUP: 			[ig.BUTTONSTATE.INSIDE, 		'startHover'],
			MOUSEOUTUP: 		[ig.BUTTONSTATE.IGNORE, 		'noEvent']
		},
		INSIDE: {
			DISABLED:			[ig.BUTTONSTATE.DISABLED,		'noEvent'],
			MOUSEIN:			[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEOUT:			[ig.BUTTONSTATE.OUTSIDE,		'endHover'],
			MOUSEINDOWN:		[ig.BUTTONSTATE.INSIDEACTIVE,	'startClick'],
			MOUSEOUTDOWN:		[ig.BUTTONSTATE.OUTSIDE,		'endHover'],
			MOUSEINUP:			[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEOUTUP:			[ig.BUTTONSTATE.OUTSIDE,		'endHover']
		},
		INSIDEACTIVE: {
			DISABLED:			[ig.BUTTONSTATE.DISABLED,		'endClickIgnore'],
			MOUSEIN:			[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEOUT:			[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEINDOWN:		[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEOUTDOWN:		[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEINUP:			[ig.BUTTONSTATE.INSIDE,			'endClick'],
			MOUSEOUTUP:			[ig.BUTTONSTATE.OUTSIDE,		'endClickIgnore']
		},
		DISABLED: {
			DISABLED:			[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEIN:			[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEOUT:			[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEINDOWN:		[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEOUTDOWN:		[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEINUP:			[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			MOUSEOUTUP:			[ig.BUTTONSTATE.IGNORE,			'noEvent'],
			ENABLED:			[ig.BUTTONSTATE.OUTSIDE,		'noEvent']
		}
	};
	
	
});


