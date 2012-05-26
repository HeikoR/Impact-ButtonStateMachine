
# Button state machine plugin for the ImpactJS game engine

`ButtonStateMachine` is a plugin for the ImpactJS game engine and offers a clean and simple way to add state management to your button entities.
The intent is to separate the state code from your main button implementation keeping your button code clean and easily readable. The modular code allows for re-use without duplication, aswell as easy substition of code with another module or modified state engine.

## How to integrate button state machine into your button entity

* Create instance of ButtonStateMachine in your button entity.
* Set the following button state input functions in your button entity (if required, else keep defaults).
	- `isMouseInside`	- *return true if mouse is inside of button clickable area, else false*
	- `isEnabled`		- *return enabled state of your button, or keep default if your button can't be disabled*
	- `isMouseDown`		- *return true if mouse.STATE is down, else false (note mouse state should return down continuosly until button up, not just once on transition)*
* Set the following state transition handlers - if required.<br>
	Note: these events only get called ONCE on state transition.
	- `startHover` 		- *notifies when mouse over clickable area*
	- `endHover` 		- *notifies when mouse leaves clickable area*
	- `startClick` 		- *notifies when mouse button down on clickable area*
	- `endClick`		- *notifies when mouse button up on clickable area*
	- `endClickIgnore`	- *notifies when mouse button up outside of clickable area*
* Call `updateState()` in your button entity's update handler.

## GameButton example

* The sample code below demonstrates how to create a simple button that uses the `ButtonStateMachine` plugin.<br>
	*For a (bit) more extensive example have a look at the [ScaledAlphaHitmask][] readme. 
	The example code adds improved hit detection for partially transparent buttons.
	(e.g. a round button, where we only want to register a 'hit' once the mouse hits the solid part of the button)*
* To run the demo code
	* place the `ButtonStateMachine.js` plugin into your `[Project]/lib/plugins` directory.
	* place the `DemoGamebtn.js` file into your `[Project]/lib/game/entities` directory.
	* place a `samplebtn.png` image into your `[Project]/media/btns` directory.
	* copy relevant code from `main.js` snippet into your own `main.js` code.

* main.js

		// -------------------------------------------------------------------------------------------------------------
		// main.js
		// -------------------------------------------------------------------------------------------------------------
		ig.module( 
			'game.main' 
		)
		.requires(
			'impact.game',
			// ...
			// ...
			'game.entities.demogamebtn'
		)
		.defines(function(){

		MyGame = ig.Game.extend({
			
			// ...
			// ...
			
			init: function() {
				// ...
				// ...

				// Capture Mouse Down events ... 
				ig.input.bind(ig.KEY.MOUSE1, 'click');		// note: we check for 'click' to determine if mouse down (see IsMouseDown() in DemoGameBtn.js)
			  
			  
				// Test DemoGameBtn
				var demoGamebtn = ig.game.spawnEntity(EntityDemoGamebtn, 100, 100, { image: 'samplebtn.png', width: 106, height: 120});
				
				window.focus();
				ig.system.canvas.onclick = function() {
					window.focus();
				};
			}
		});

* DemoGamebtn.js

		// -------------------------------------------------------------------------------------------------------------
		// DemoGamebtn.js
		// -------------------------------------------------------------------------------------------------------------
		ig.module(
			'game.entities.demogamebtn'
		)
		.requires(
			'plugins.button-state-machine',
			'impact.entity'
		)
		.defines(function() {
			EntityDemoGamebtn = ig.Entity.extend({
				size: {x: 16, y: 16},
				
				btnStateMachine: null,
				
				// -------------------------------------------------------------------------------------------------------------
				// Button States
				// -------------------------------------------------------------------------------------------------------------
				endClick: function() { this.currentAnim = this.anims.btnNormal;	},
				endClickIgnore: function() { this.currentAnim = this.anims.btnNormal; },
				endHover: function() { this.currentAnim = this.anims.btnNormal;	},
				startClick: function() { this.currentAnim = this.anims.btnDown;	},
				startHover: function() { this.currentAnim = this.anims.btnHover; },
				
				// -------------------------------------------------------------------------------------------------------------
				// Alpha Hit Detection
				// -------------------------------------------------------------------------------------------------------------
				// hittest - returns true if mouse cursor within bounds, else false
				hittest: function() {
					if ((ig.input.mouse.x > this.pos.x && ig.input.mouse.x < (this.pos.x + this.size.x)) &&
						(ig.input.mouse.y > this.pos.y && ig.input.mouse.y < (this.pos.y + this.size.y)))
					{
						return true;
					}
					return false;						// hittest failed - mouse outside of entity
				},
				init: function(x, y, settings) {
					
					this.animSheet = new ig.AnimationSheet('media/btns/' + settings.image , settings.width, settings.height);
					this.addAnim('btnNormal', 1, [0]);
					this.addAnim('btnHover', 2, [1]);
					this.addAnim('btnDown', 3, [2]);
					this.addAnim('btnDisabled', 4, [3]);
					this.currentAnim = this.anims.btnNormal;
					this.size.x = settings.width;
					this.size.y = settings.height;
					
					// ...
					// ...
					this.btnStateMachine = new ig.ButtonStateMachine();
					this.btnStateMachine.isMouseInside = this.hittest.bind(this);
					this.btnStateMachine.isMouseDown = function() { return ig.input.state('click'); };
					this.btnStateMachine.startClick = this.startClick.bind(this);
					this.btnStateMachine.endClick = this.endClick.bind(this);
					this.btnStateMachine.startHover = this.startHover.bind(this);
					this.btnStateMachine.endHover = this.endHover.bind(this);
					this.btnStateMachine.endClickIgnore = this.endClickIgnore.bind(this);
					
					this.parent(x, y, settings);
				},
				update: function() {
					this.parent();
					
					this.btnStateMachine.updateState();
				}
			});
		});




## Still Todo, and Bugs to be fixed (if required or requested)

* Test disabled button state.
* Test enabling/disabling of buttons while state engine in different states.
* *Feedback welcome here ...*

## Future Improvements

* *Any thoughts welcome here ...*



[ScaledAlphaHitmask]: https://github.com/HeikoR/Impact-ScaledAlphaHitmask





