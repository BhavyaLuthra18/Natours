/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// signup form
export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8584/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm
      }
    });
    if (res.data.status === 'success') {
      showAlert('success', 'signed up in successfully!');
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
