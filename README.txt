-> I tried to implement all the features for this scene. 

Approach : 
- All the code for the scene is in main.js
===============================================================================================================
- For each character, I broke down the character into indvidual parts. 
	- Jellyfish : body and tentacles
	- Astronaut : head, torso, arms, legs
- i created a seperate function for each individual part (for example drawTorso() for the astronaut torso)
===============================================================================================================
- after creating the static body parts, i added motion to them using seperate functions (for example animateArms() for rotating the arm)
=================================================================================================================
- finally i called all the functions inside render(timestamps){}
===============================================================================================================

PS - if you wish to know my though process as i did the assignment, you can see my commit history here : https://github.com/arya-2407/floating-astronaut

Thank You!