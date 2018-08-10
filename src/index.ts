import * as THREE from 'three';
import * as $ from 'jquery';

async function test(){
	return;
}

$(async () => {
	await test();
	alert();
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, $('body').width() / $('body').height(), 0.1, 1000 );

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( $('body').width(), $('body').height() );
	document.body.appendChild( renderer.domElement );

	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	camera.position.z = 5;

	var animate = function () {
		requestAnimationFrame( animate );

		cube.rotation.x += 0.01;
		cube.rotation.y += 0.01;

		renderer.render( scene, camera );
	};

	animate();
});

