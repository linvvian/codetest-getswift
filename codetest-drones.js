var axios = require('axios')

Number.prototype.toRad = function() {
 return this * Math.PI / 180;
}

class CodeTest {
  constructor(){
    // 303 Collins Street, Melbourne, VIC 3000
    // the latitude and longitude of the depo address
    this.depoLocation = { latitude: -37.816558, longitude: 144.963853 }

    // retrieve data from API
    this.listOfDrones = this.fetchDrones()
    this.listOfPackages = this.fetchPackages()

    // using test example dataset
    // this.listOfDrones = drones
    // this.listOfPackages = packages
  }

  // Drones travel at a fixed speed of 50km/h
  assignPackages() {
    // get the remaining distances drones need to travel until they return to depo location
    // then sort based on the shortest distance left
    let closestDrones = this.getDroneTravelDistance().sort(this.sortByDistance.bind(this))

    // sorting packages based on the closest deadline
    let packagesByDeadline = [...this.listOfPackages]
    packagesByDeadline.sort( function(a, b) {
      return a.deadline - b.deadline
    })

    let assignments = []
    let unassignedPackageIds = []

    // assigning packages with the closest deadlines to the drones that are closests to the depo location
    for(let i = 0; i < packagesByDeadline.length; i++){
      // check if there are anymore available drones
      if (!closestDrones[i]) {
        unassignedPackageIds.push(packagesByDeadline[i].packageId)
      }
      // assignment of package and drone
      else {
        assignments.push({ droneId: closestDrones[i].droneId, packageId: packagesByDeadline[i].packageId })
      }
    }

    return {
      assignments: assignments,
      unassignedPackageIds: unassignedPackageIds,
    }
  }

  // getting the distance needed for drone to travel
  getDroneTravelDistance(){
    return this.listOfDrones.map(drone => {
      // if drone does not have a package assume it is on way back to depo and so only need to calculate distance from current location to depo location
      if (drone.packages.length === 0){
        let distanceLeftToDepo = this.calculateDistanceHaversine(this.depoLocation, drone.location)
        return Object.assign({}, drone, { distanceLeft: distanceLeftToDepo })
      }

      // else drone is carrying a package and so will need to calculate distance left to deliver then distance back to depo location
      let distanceLeftToDelivery = this.calculateDistanceHaversine(drone.location, drone.packages[0].destination)
      let distanceFromDestinationToDepo = this.calculateDistanceHaversine(drone.packages[0].destination, this.depoLocation)
      return Object.assign({}, drone, { distanceLeft: distanceLeftToDelivery + distanceFromDestinationToDepo })
    })
  }

  // callback to for sorting drones based on their distance from the depo
  sortByDistance(a, b) {
    return Math.abs(a.distanceLeft) - Math.abs(b.distanceLeft)
  }

  // calculates distance between two latitude and longitude coordinates using the Haversine Distance Formula
  calculateDistanceHaversine(coordinate1, coordinate2) {
    const lat1 = coordinate1.latitude,
          lon1 = coordinate1.longitude,
          lat2 = coordinate2.latitude,
          lon2 = coordinate2.longitude

    var R = 6371e3; // metres
    var φ1 = lat1.toRad();
    var φ2 = lat2.toRad();
    var Δφ = (lat2-lat1).toRad();
    var Δλ = (lon2-lon1).toRad();

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c // distance in meters
  }

  // fetching drones from the API and assigning to variable
  fetchDrones() {
    axios('https://codetest.kube.getswift.co/drones')
    .then( (response) => {
      this.listOfDrones = response.data
    })
  }

  // fetching packages from the API and assigning to variable
  fetchPackages() {
    return axios('https://codetest.kube.getswift.co/packages')
    .then( (response) => {
      this.listOfPackages = response.data
    })
  }
}

var codetest = new CodeTest()
// to wait for promises to be fufilled
setTimeout( function(){ console.log(codetest.assignPackages()) }, 3000)

// test example dataset
// var drones = [
//   { "droneId": 202458,
//     "location": { "latitude": -37.77445575532243, "longitude": 144.85745656761716 },
//     "packages": [ { "destination": { "latitude": -37.78237449270427, "longitude": 144.8480457807703 },
//         "packageId": 2127, "deadline": 1507140532 } ] },
//   { "droneId": 214038,
//     "location": { "latitude": -37.78256733291591, "longitude": 144.85544059080232 },
//     "packages": [ { "destination": { "latitude": -37.782476142378115, "longitude": 144.8470360134489 },
//         "packageId": 2193, "deadline": 1507138169 } ] },
//   { droneId: 333757,
//     location: { latitude: -37.78203228402833, longitude: 144.86286016617612 },
//     packages: [] },
//   { droneId: 334040,
//     location: { latitude: -37.78480071599118, longitude: 144.85733988510597 },
//     packages: [] },
//   ]
//
// var packages = [
//   { destination: { latitude: -37.77039208339401, longitude: 144.85578327949884 },
//     packageId: 6300,
//     deadline: 1507133507 },
//   { destination: { latitude: -37.765422425865296, longitude: 144.85693916413615 },
//     packageId: 9137,
//     deadline: 1507135317 }
//   ]
