/* eslint-disable */
// update Data
import axios from 'axios';
import { showAlert } from './alerts';

// data is all the data to update
// and the type  is the type is either data or password
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:8584/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:8584/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
