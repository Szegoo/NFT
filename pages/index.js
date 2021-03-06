import Web3 from 'web3';
import React from 'react';
import axios from 'axios';
import {ABI} from '../ABI';

const web3 = new Web3(Web3.givenProvider);
const contractAddress = "0x58c1F6bA4bca01b57Caa84d4AF1CAd1F2d10d713";

export default class Index extends React.PureComponent {
	state = {
		lastId: 0,
		collectibles: null
	}
	componentDidMount() {
		this.collectible = new FormData();
		this.getCollectibles();
	}
	createCollectible = async() => {
		const accounts = await window.ethereum.enable();
		const account = accounts[0];
		const NFTContract = new web3.eth.Contract(ABI, contractAddress, {from: account});
		NFTContract.methods.getLastId().call().then(lastId => {
			const nextId = Number(lastId) +1;
			this.collectible.set("id", nextId);
			let url = `http://nft-app1.herokuapp.com/api/nft?id=${nextId}`
			NFTContract.methods.createItem(account, url).send().then(async(response) => {
				await axios.post("/api/add-nft", this.collectible);
				console.log(response);
				//pozivam opet da bi se dodao novi token
				this.getCollectibles();
			});  
		});
	}
	getCollectibles = async() => {
		const accounts = await window.ethereum.enable();
		const account = accounts[0];
		const NFTContract = new web3.eth.Contract(ABI, contractAddress, {from: account});
		let collectibles = [];
		const lastId = await NFTContract.methods.getLastId().call();
 		for(let i = 1, j=0; i <= lastId; i++) {
			const ownerOf = await NFTContract.methods.ownerOf(i).call();
			if(account.toLowerCase() === ownerOf.toLowerCase()) {
				let url = await NFTContract.methods.tokenURI(i).call();
				console.log(url);
				collectibles[j] = (await axios.get(url)).data;
				j++;
			}
		} 
		this.setState({collectibles});
	}
	handleChange = (e) => {
		this.collectible.set("image", e.target.files[0]);
	}
	render() {
		let {collectibles} = this.state;
		console.log(collectibles);
		return (
			<div>
				<h1 className="title">
					Napravi svoj kolekcionarski token
				</h1>
				<label htmlFor="image">
					Postavi sliku svog kolekcionarskog tokena
					(slike se smanjuju na 500x500px)
				</label>
				<input onChange={this.handleChange} name="image" type="file"/>
				<button onClick={this.createCollectible}>Create</button>
				<h2>Your NFT's: </h2>
				<div className="collectibles">
				{collectibles&& collectibles.map(collectible => 
					<div key={collectible.id} className="collectible">
						<img src={collectible.image}/>
						<p>id: {collectible.id}</p>
					</div>
				)}
				</div>
			</div>
		)
	}
}