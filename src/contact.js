import React from 'react';
import Header from './components/header';
import Footer from './components/footer';

const Contact = () => {
  return (
    <div style={{display:'flex', flexDirection:'column', minHeight:'100vh'}}>
    <Header />
    <section id="" style={{ marginTop: '80px', flex:1 }}> {/* Adjusted padding */}
        <div className="container">
            <h2 className="text-uppercase text-center text-secondary mb-0">Contact Me</h2>
            <hr className="star-dark mb-5"/>
            <div className="row">
                <div className="col-lg-8 mx-auto">
                    <form id="contactForm" name="sentMessage">
                        <div>
                            <div className="mb-0 form-floating pb-2">
                                <input className="form-control" type="text" id="name" required placeholder="Name"/>
                                <label className="form-label">Name</label>
                                <small className="form-text text-danger help-block"></small>
                            </div>
                        </div>
                        <div>
                            <div className="mb-0 form-floating pb-2">
                                <input className="form-control" type="email" id="email" required placeholder="Email Address"/>
                                <label className="form-label">Email Address</label>
                                <small className="form-text text-danger help-block"></small>
                            </div>
                        </div>
                        <div>
                            <div className="mb-0 form-floating pb-2">
                                <input className="form-control" type="tel" id="phone" required placeholder="Phone Number"/>
                                <label className="form-label">Phone Number</label>
                                <small className="form-text text-danger help-block"></small>
                            </div>
                        </div>
                        <div>
                            <div className="mb-5 form-floating pb-2">
                                <textarea className="form-control" id="message" required placeholder="Message" style={{ height: '150px' }}></textarea>
                                <label className="form-label">Message</label>
                                <small className="form-text text-danger help-block"></small>
                            </div>
                        </div>
                        <div id="success"></div>
                        <div>
                            <button className="btn btn-primary btn-xl" id="sendMessageButton" type="submit">Send</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </section>
    <Footer />
    </div>
  );
};

export default Contact;
