/* eslint-disable */
// login function
import axios from 'axios';
import { showAlert } from './alerts';
export const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8584/api/v1/users/login',
      data: {
        email,
        password
      }
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        // to another page
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.error(err);
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8584/api/v1/users/logout'
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged out successfully');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
