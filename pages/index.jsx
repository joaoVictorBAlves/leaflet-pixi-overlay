// Styles and Material UI
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
// Data and Import utilities
import dynamic from "next/dynamic";
import data from "../data/fortaleza.json"
import data_markers from "../data/MarkerMap.json";
import points from "../data/teste-rota.json"
import { useEffect, useState } from "react";
const Map = dynamic(() => import("../MapComponent"), {
  ssr: false
});

const Home = () => {
  // STATES
  const [choroplethVar, setChoropletVar] = useState();
  const [route, setRoute] = useState();
  const [markersVar, setMarkersVar] = useState();
  const [lon, setLon] = useState(data.features[0].geometry.coordinates[0][0][0]);
  const [lat, setLat] = useState(data.features[0].geometry.coordinates[0][0][1]);
  const drawerWidth = 240;
  var fetch_data = null;
  // LISTAS DE PROPRIEDADES DOS GRÁFICOS
  const propsPolygon = [];
  const propsMarkers = [];
  Object.keys(data.features[0].properties).forEach((item) => {
    if (!isNaN(data.features[0].properties[item])) {
      propsPolygon.push(item);
    }
  });
  Object.keys(data_markers[0].properties).forEach((item) => {
    if (!isNaN(data_markers[0].properties[item])) {
      propsMarkers.push(item);
    }
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248a096800fd41c43268951103adacba4d4&start=${points[0].lon},${points[0].lat}&end=${points[1].lon},${points[1].lat}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        fetch_data = await response.json().then(data => {
          setRoute(data);
        })

      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      }
    }
    fetchData()
  }, [])

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Leaflet-pixi-overlay map
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem disablePadding style={{ display: "flex" }}>
              <MapOutlinedIcon style={{ marginLeft: 20, marginTop: 18, marginRight: 5 }} fontSize="medium" />
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="demo-simple-select-standard-label">Choropleth</InputLabel>
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={choroplethVar}
                  onChange={(e) => { setChoropletVar(e.target.value) }}
                  label="Choropleth"
                >
                  {choroplethVar && <MenuItem value={undefined}>Nenhum</MenuItem>}
                  {propsPolygon.map((prop) => (
                    <MenuItem key={prop} value={prop}>{prop}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ListItem>
            <ListItem disablePadding style={{ display: "flex" }}>
              <LocationOnOutlinedIcon style={{ marginLeft: 20, marginTop: 18, marginRight: 5 }} fontSize="medium" />
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="demo-simple-select-standard-label">Marcadores</InputLabel>
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={markersVar}
                  onChange={(e) => { e.target.value === "" ? setMarkersVar(undefined) : setMarkersVar(e.target.value) }}
                  label="Marcadores"
                >
                  {propsMarkers.map((prop) => (
                    <MenuItem key={prop} value={prop}>{prop}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ListItem>
          </List>
          <Divider />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Toolbar />
        <Map
          data={data}
          coordinates={[lat, lon]}
          zoom={11}
          variable={choroplethVar}
          // dataMakers={data_markers}
          // makerVariable={markersVar}
          // route={route}
        />
      </Box>
    </Box>
  );
}

export default Home;