// Styles and Material UI
import { Button, FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, Select, TextField } from "@mui/material";
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
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
// Data and Import utilities
import dynamic from "next/dynamic";
import data from "../data/mapa-social-caucaia.json"
import data_markers from "../data/evasao-escolar-caucaia-em-2019.json";
import points from "../data/teste-rota.json"
import { useEffect, useState } from "react";
import { index } from "d3";
import { UploadFile } from "@mui/icons-material";
const Map = dynamic(() => import("../Map"), {
  ssr: false
});

const Home = () => {
  // States
  // const [file, setFile] = useState(null);
  // const [fileName, setFileName] = useState('');
  const [choroplethVar, setChoropletVar] = useState();
  const [route, setRoute] = useState();
  const [makersVar, setMakersVar] = useState();
  const [lon, setLon] = useState(data.features[0].geometry.coordinates[0][0][0]);
  const [lat, setLat] = useState(data.features[0].geometry.coordinates[0][0][1]);
  const drawerWidth = 240;
  let fetch_data;

  // Distribution of props in Arrays
  const propsPolygon = [];
  const propsMarkers = [];

  Object.keys(data.features[0].properties).forEach((item) => {
    if (!isNaN(data.features[0].properties[item])) {
      propsPolygon.push(item);
    }
  });
  Object.keys(data_markers[0]).forEach((item) => {
    if (!isNaN(data_markers[0][item])) {
      propsMarkers.push(item);
    }
  });

  // Handle Functions
  // const handleChange = (event) => {
  //   setFile(event.target.files[0]);
  //   setFileName(event.target.files[0].name);
  // };

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
            {/* <ListItem disablePadding style={{ display: "flex" }}>
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120, margin: 'auto' }}>
                <input
                  accept="*"
                  style={{ display: 'none' }}
                  id="contained-button-file"
                  type="file"
                  onChange={handleChange}
                />
                <TextField
                  id="file-name"
                  label="File Name"
                  value={fileName ? fileName : ""}
                  margin="normal"
                  variant="standard"
                  disabled
                />
                <label htmlFor="contained-button-file" style={{ margin: 'auto' }}>
                  <Button variant="contained" component="span" endIcon={<UploadFile />} style={{ margin: 10 }}>
                    Choose File
                  </Button>
                </label>
              </FormControl>
            </ListItem> */}
            {/* <Divider style={{ marginTop: 20 }} /> */}
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
                    <MenuItem value={prop}>{prop}</MenuItem>
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
                  value={makersVar}
                  onChange={(e) => { e.target.value === "" ? setMakersVar(undefined) : setMakersVar(e.target.value) }}
                  label="Marcadores"
                >
                  {propsMarkers.map((prop) => (
                    <MenuItem value={prop}>{prop}</MenuItem>
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
          coordenates={[lat, lon]}
          zoom={11}
          choroplethVariable={choroplethVar}
          dataMakers={data_markers}
          makerVariable={makersVar}
          route={route}
        />
      </Box>
    </Box>
  );
}

export default Home;