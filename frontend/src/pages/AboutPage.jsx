import React from 'react'
import { Footer, Navbar } from "../components";

const AboutPage = () => {
  return (
    <>
      <Navbar />
      <div className="container my-3 py-3">
        <h1 className="text-center">About Our Fashion Store</h1>
        <hr />
        <p className="lead text-center">
          Welcome to Vestoria, where style meets comfort! We're passionate about bringing you the latest trends in clothing and wearable accessories at affordable prices. Founded in [Year], our mission has been to provide high-quality fashion that helps you express your unique personality while feeling confident in what you wear.
        </p>
        
        <p className="text-center">
          Our carefully curated collections feature everything from everyday essentials to statement pieces, sourced from trusted designers and manufacturers. We believe fashion should be accessible to everyone, which is why we offer a wide range of sizes and styles to suit all body types and preferences.
        </p>

        <h2 className="text-center py-4">Our Collections</h2>
        <div className="row">
          <div className="col-md-3 col-sm-6 mb-3 px-3">
            <div className="card h-100">
              <img className="card-img-top img-fluid" src="https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Men's fashion" height={160} />
              <div className="card-body">
                <h5 className="card-title text-center">Men's Fashion</h5>
                <p className="card-text text-center">Trendy shirts, comfortable jeans, formal wear, and accessories for the modern man.</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3 px-3">
            <div className="card h-100">
              <img className="card-img-top img-fluid" src="https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Women's fashion" height={160} />
              <div className="card-body">
                <h5 className="card-title text-center">Women's Fashion</h5>
                <p className="card-text text-center">Elegant dresses, comfortable casual wear, and stylish outfits for every occasion.</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3 px-3">
            <div className="card h-100">
              <img className="card-img-top img-fluid" src="https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Jewelry collection" height={160} />
              <div className="card-body">
                <h5 className="card-title text-center">Jewelry & Accessories</h5>
                <p className="card-text text-center">Beautiful pieces to complement your style, from statement necklaces to delicate earrings.</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3 px-3">
            <div className="card h-100">
              <img className="card-img-top img-fluid" src="https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Footwear collection" height={160} />
              <div className="card-body">
                <h5 className="card-title text-center">Footwear</h5>
                <p className="card-text text-center">Stylish and comfortable shoes for all seasons and occasions.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <h3 className="text-center">Our Values</h3>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">✔ Quality craftsmanship in every stitch</li>
              <li className="list-group-item">✔ Ethical and sustainable sourcing</li>
              <li className="list-group-item">✔ Inclusive sizing for all body types</li>
              <li className="list-group-item">✔ Affordable prices without compromising quality</li>
              <li className="list-group-item">✔ Excellent customer service</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default AboutPage