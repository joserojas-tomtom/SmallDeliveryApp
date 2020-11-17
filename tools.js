
// This function will return an array of route summaries between
// the lastpoint and the rest of the points.
// Each element of the array is like:
//
// {
//    name: 'A->B',
//    distance: nnn ( in mts ) 
//    time: ss ( in seconds )
// }
async function getSummaries(lastPoint, points) {
  var originalPoints = [...points]
  try {
    var origins = [
      {
        point: { latitude: lastPoint.location.lat, 
                  longitude: lastPoint.location.lng
        }
      }
    ]
    var destinations = []
    for ( i=0 ; i<points.length ;i++) {
      destinations.push(
        {
          point: { latitude: points[i].location.lat, 
                  longitude: points[i].location.lng
          }
        }
      )
    }
    //console.log('matrix with '+points.length+ ' items')
    let routeGeoJson = await tt.services.matrixRouting({
      key: APIKEY,
      origins: origins,
      destinations: destinations,
      travelMode: 'truck',
      traffic: true
    })
    .go()
    // populate the matrix of distances and times
    var currentMatrix = []
    for (index = 0 ; index < routeGeoJson[0].length ; index++){
      //console.log('name '+originalPoints[index])
      currentMatrix.push({
        name: '['+lastPoint.name+'->'+originalPoints[index].name+']',
        distance: routeGeoJson[0][index].routeSummary.lengthInMeters,
        time: routeGeoJson[0][index].routeSummary.travelTimeInSeconds,
      })
    }
    
    // Wait 1 sec. This is arbitrary. I just don't want to get QPS denials
    await new Promise((resolve, reject) => setTimeout(resolve, 500));
    return currentMatrix
  }
  catch (error ) {
    console.error('oops, something went wrong!', error);
  }
}

// Returns the cost ( speed or distance ) 
// of the segment defined by the 2 points (pt1 and pt2)
var getCost = (id,matrix,pt1,pt2) => {
  var name = '['+pt1.name+'->'+pt2.name+']'
  for ( element of matrix) {
    if (element.name == name) {
      console.log('Cost for '+name+' : '+element.distance)
      if (id == 'summaryByTime') {
        return(element.time)
       } else {
         return (element.distance)
       }
    }
  }
  console.log(name+ ' NOT FOUND!')
}

///////////
// Other useful functions that I thought we would use
///////////

// haversine great circle distance
var distance = (pt1, pt2) => {
  const lng1 = pt1.location.lng
  const lng2 = pt2.location.lng
  const lat1 = pt1.location.lat
  const lat2 = pt2.location.lat
  if (lat1 === lat2 && lng1 === lng2) {
    return 0
  }

  var radlat1 = (Math.PI * lat1) / 180
  var radlat2 = (Math.PI * lat2) / 180

  var theta = lng1 - lng2
  var radtheta = (Math.PI * theta) / 180

  var dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)

  if (dist > 1) {
    dist = 1
  }
  dist = Math.acos(dist)
  dist = (dist * 180) / Math.PI
  return dist * 60 * 1.1515 * 1.609344
}

const pathCost = path => {
  return path
    .slice(0, -1)
    .map((point, idx) => distance(point, path[idx + 1]))
    .reduce((a, b) => a + b, 0)
}

 const counterClockWise = (p, q, r) => {
  return (q[0] - p[0]) * (r[1] - q[1]) < (q[1] - p[1]) * (r[0] - q[0])
}

 const intersects = (a, b, c, d) => {
  return (
    counterClockWise(a, c, d) !== counterClockWise(b, c, d) &&
    counterClockWise(a, b, c) !== counterClockWise(a, b, d)
  )
}

setDifference = (setA, setB) => {
  const ret = new Set(setA)
  setB.forEach(p => {
    ret.delete(p)
  })
  return ret
}

function convertSecondstoTime(given_seconds) { 

      dateObj = new Date(given_seconds * 1000); 
      hours = dateObj.getUTCHours(); 
      minutes = dateObj.getUTCMinutes(); 
      seconds = dateObj.getSeconds(); 

      return hours.toString().padStart(2, '0') 
          + ':' + minutes.toString().padStart(2, '0') 
          + ':' + seconds.toString().padStart(2, '0'); 
     
} 

function convertToKM(mts) {
  var km = mts/1000
  return km.toFixed(2)
}
