import React, { Component } from 'react';
import Particles from 'react-particles-js';
import _ from 'lodash';

import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo';
import Rank from './components/Rank/Rank';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';

import './App.css';

const particlesOptions = {
  particles: {
    number: {
      value: 120,
      density: {
        enable: true,
        value_area: 800
      }
    }
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
      boxes: [],
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: ''
      }
    }
  }
  
  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }

  calculateFaceLocations = (data) => {
    const clarifaiResponse = data.outputs[0].data.regions
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    const result = [];
    _.forEach(clarifaiResponse, (res) => {
      const boundingBox = res.region_info.bounding_box;
      result.push(
        {
          leftCol: boundingBox.left_col * width,
          topRow: boundingBox.top_row * height,
          rightCol: width - (boundingBox.right_col * width),
          bottomRow: height - (boundingBox.bottom_row * height)
        }
      )
    })
    this.setState({boxes: result});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
      fetch('https://smartbrain-2020-api.herokuapp.com/imageurl', {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          input: this.state.input
        })
      })
      .then(response => {
        if (response.status === 400) {
          throw new Error('no picture/face detected');
        }
        else return response.json()
      })
      .then(response => {
        if (response) {
          fetch('https://smartbrain-2020-api.herokuapp.com/image', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState({
                user: {
                  ...this.state.user,
                  entries: count
                }
              });
            })
            .catch(console.log)
        }
        this.calculateFaceLocations(response)
      })
      .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState({
        input: '',
        imageUrl: '',
        boxes: [],
        route: 'signin',
        isSignedIn: false,
        user: {
          id: '',
          name: '',
          email: '',
          entries: 0,
          joined: ''
        }
      })
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  render() {
    const { isSignedIn, imageUrl, route, boxes } = this.state;
    return (
      <div className="App">
         <Particles className='particles'
          params={particlesOptions}
        />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} log={this.logOut}/>
        { route === 'home'
          ? <div>
              <Logo />
              <Rank
                name={this.state.user.name}
                entries={this.state.user.entries}
              />
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
              />
              <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
            </div>
          : (
             route === 'register'
             ? <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
             : <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange}/> 
            )
        }
      </div>
    );
  }
}

export default App;