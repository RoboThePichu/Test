﻿#pragma strict
@script RequireComponent(SimplePathing)
@script RequireComponent(NetworkView)

/* Things that NEED to be set by specialized file for creature */
var objHeight: float; //The total hight of the object
var BasicAttackObj: GameObject; //The object to use for Basic Attacks
var DeathFunc: Function; //A function to handle when the creature dies
/*-------------------------------------------------------------*/

var Pathing: SimplePathing;
var PlayerCamera : GameObject;

var MenuSkin: GUISkin;

var currentHealth: double = 1000;
var maxHealth: double = 1000;
var healthRegen: float = 10;
var speed: float;

var AtkSpeed: float = 2.5;
var nextAtk: float = 0;

var isMine: boolean;
var isDead: boolean = false;

var hpBarSize: int = 100;
var hpBarImgPlayer: Texture2D;
var hpBarImgEnemy: Texture2D;
var hpBarImgAlly: Texture2D;
var HPBarPos: Vector3;
var HPBarPosW: Vector3;
//var HPBarPosS: Vector3;
var InterruptHPB: boolean = false;
var Name = "";

var Team: int = 0;
function Awake(){
	isMine = networkView.isMine;
}
function Start () {
	Pathing = GetComponent(SimplePathing);
	PlayerCamera = Camera.main.gameObject;
	speed = Pathing.speed;
	//isMine = networkView.isMine;
}

function Update () {

}

function BasicAttack(target : Collider){
	if(!BasicAttackObj){
		Debug.LogWarning("The Creature wants to do a Basic Attack, but it has nothing to attack with!  (Did you forget to set the BasicAttackObj in the creaures script?)");
		return;
	}
	if(Time.time > nextAtk){
		Debug.LogWarning("It's a basic attack from Generic Creature");
		var thing = Network.Instantiate(BasicAttackObj, Vector3(transform.position.x, transform.position.y, transform.position.z), transform.rotation, 0);
		//var viewID = Network.AllocateViewID();
		//Debug.LogWarning(viewID);
		/*var uniqueNum = Random.value *100;
		var thingName = "Arrow" + uniqueNum;
		thing.name = thingName;
		var AutoAttack = GameObject.Find(thingName).GetComponent(ProjectileScript);
		AutoAttack.target = target;
		AutoAttack.firedBy = this.name;
		Debug.Log("Arrow Fired: "+uniqueNum);*/
		networkView.RPC("createAtk", RPCMode.All, thing.name, target.name);//, viewID);
		
		nextAtk = Time.time + AtkSpeed;
	}
}

@RPC
function gainHealth(hp: float){
	if(currentHealth + hp <= maxHealth){
		currentHealth += hp;
	}else if(currentHealth + hp > maxHealth){
		currentHealth += (currentHealth + hp) - maxHealth;
	}
	if(currentHealth > maxHealth){
		currentHealth = maxHealth;
	}
}

@RPC
function takeDamage(hp: float){
	currentHealth -= hp;
	if(currentHealth <= 0){
		networkView.RPC("Die", RPCMode.All);
	}
}

@RPC
function createAtk(thingName: String, targetName: String){//, viewID: NetworkViewID){
		//Debug.Log(thing); Debug.Log(target);
		var thing = GameObject.Find(thingName);
		thing.GetComponent(ProjectileScript).target = GameObject.Find(targetName).collider;
		//AutoAttack.target = GameObject.Find(targetName).collider;
		
		//var uniqueNum = ""+thing.networkView.viewID;
		//var thingName = "Arrow" + uniqueNum;
		//.GetComponent(ProjectileScript);
		//thing.name = "Arrow" + uniqueNum;
		
		//var nView = thing.GetComponent(NetworkView);
		//nView.viewID = viewID;
		

		
		//AutoAttack.firedBy = this.name;
		/*AutoAttack*/thing.GetComponent(ProjectileScript).doneSet = true;
		//Debug.Log("Arrow Fired: "+uniqueNum);

}
@RPC
function Die(){
	isDead = true; //Tells anything that cares that this object is currently dead
	if(DeathFunc){
		DeathFunc(); //A function set by some other script to tell what happens now.
	}else Debug.LogWarning("Supposedly we died, but there is no function to handle the death!  It's still set as dead if anyone asks");
}


function OnGUI(){
	if(!objHeight){
		Debug.LogWarning("Shit!  objHeight isn't set!  Hopefully, you just forgot to set it in the creatures script!  For now, we are going to use a guess (2 units), but this is probably not perfect!  Expect the HP Bar to be placed, and/or behave weird!");
	}
		var MainGC = PlayerCamera.GetComponent(CameraControls).GenCre; //Gets the Generic Creature script from the main (read: only) camera's player
		HPBarPosW = transform.position - Vector3(0, -((objHeight ? objHeight : 2)/2) -0.5, 0); //This is the world position of the health bar that we will convert into screen cordinates so we can keep the hp bars right above their heads
		var screenPos : Vector3 = Camera.main.WorldToScreenPoint(HPBarPosW); //Convert it to where it should be on the screen
		var percHP = currentHealth / maxHealth;
		var curHPBarSize = parseInt(100*percHP);

		if(!InterruptHPB){ //This allows us to modify the position from the inspector
			HPBarPos.x = screenPos.x -(hpBarSize/2); //Centering it
			HPBarPos.y = Screen.height-screenPos.y;//-40;  //I don't know exactly why, but we have to do it like this.  It makes it so it isent on the bottom of the model.
			HPBarPos.z = screenPos.z; //Is it infront of the camera? This value tells us that!  If it is positive, it is front of the camera, else it is not, and we shouldnt show the player the HP bar.
		}
		if(HPBarPos.z >= 0){
			GUI.Box(Rect(HPBarPos.x ,HPBarPos.y,hpBarSize,20), ""); //A empty container box
			GUI.Box(Rect(HPBarPos.x,HPBarPos.y,curHPBarSize,20), isMine ? hpBarImgPlayer : MainGC.Team == Team ? hpBarImgAlly : hpBarImgEnemy); //This is the hp bar, which conviently also changes depending on wither it is you, ally, or enemy.
			GUI.Label(Rect(screenPos.x-(hpBarSize/4),Screen.height-screenPos.y, 100, 20), currentHealth+"/"+maxHealth); //This tells you the actual health
			if(Name)GUI.Box(Rect(screenPos.x-(hpBarSize/2),Screen.height-screenPos.y-20, 100, 20), Name, MenuSkin.box);
			//GUI.Label(Rect(screenPos.x-(hpBarSize/4),Screen.height-screenPos.y-20, 100, 20), Name);
		}
	//}
}