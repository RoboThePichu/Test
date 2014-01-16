﻿using UnityEngine;
using System.Collections;
namespace SuddenlyEntertainment{
public class ProjectileServer : MonoBehaviour {
	public string Target;
	public float Speed;

		public float Damage;

	// Use this for initialization
	void Start () {
		Speed = 1;
			Damage = 200;
	}
	
	// Update is called once per frame
	void Update () {
		transform.position = Vector3.MoveTowards(transform.position, SuddenlyEntertainment.MainManager.PlayerDict[Target].PlayerObj.transform.position, Speed);
	}

	void OnTriggerEnter(Collider collider){
		if(collider.tag == "Player"){
			PlayerScriptClient PSC = collider.GetComponent<PlayerScriptClient>();
				PSC.Stats.CurrentHealth += -Damage;
			Network.Destroy(gameObject);
		}

	}
}
}
