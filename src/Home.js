import React from 'react';
import Header from './components/header';
// import Footer from './components/footer';
// import MapChart from './components/home/mapchart'; // Make sure the path is correct
// import Persons from './components/home/persons';
// import CardComponent from './components/home/cards';

const Home = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            {/* <Footer /> */}
        </div>
    );
}

export default Home;
