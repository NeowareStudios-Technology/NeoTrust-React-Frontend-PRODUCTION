import axios from "axios";

//set up of pre-configured instance of the axios client
export default axios.create({
  baseURL: "https://us-central1-neotrust.cloudfunctions.net"
});
