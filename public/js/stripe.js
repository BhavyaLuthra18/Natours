/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51PDLFBSI3cmSO3rMq29w87eb8F4xWzUnQrcnmYZyMDdegKxUJ9ImxrA63U19shYdVGh6BI0BlEkER2ZxP2maLeqF003dSePMa3'
);

export const bookTour = async tourId => {
  try {
    //1)  Get the checkout session from the API
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    //2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
