# vestoria-ecommerce

**Vestoria** is a modern eCommerce platform designed to provide a seamless shopping experience for both customers and vendors. Built with Django for the backend and React for the frontend, Vestoria supports features such as user authentication, product management, and order processing.

## Features

- **User Roles:** Custom user model with roles for customers and vendors.
- **Product Management:** Create, read, update, and delete products and categories.
- **Shopping Cart:** Users can add products to their cart and proceed to checkout.
- **Order Management:** Track order status and history.
- **Reviews:** Customers can leave reviews and ratings for products.
- **Contact Form:** Users can submit inquiries through a contact form.

## Learnings

Through the development of Vestoria, I gained significant experience in:

- Building RESTful APIs with Django REST Framework.
- Implementing JWT authentication for secure user access.
- Managing complex database relationships using Django's ORM.
- Creating a responsive frontend with React, enhancing user experience.
- Handling state management in React applications.

## Challenges Faced

- **User Authentication:** Implementing secure JWT authentication was challenging initially, but I learned how to manage token-based authentication effectively.
- **Handling Media Files:** Managing image uploads and storage required careful configuration to ensure that files were served correctly.
- **Cross-Origin Resource Sharing (CORS):** Configuring CORS to allow communication between the frontend and backend was a learning curve.

## Tools Used

- **Django:** Web framework for building the backend.
- **Django REST Framework:** For creating RESTful APIs.
- **Django Simple JWT:** For token-based authentication.
- **React:** Frontend library for building user interfaces.
- **CORS Headers:** To handle CORS issues.
- **PostgreSQL (or your chosen database):** For data storage.

## Installation Instructions

### Backend Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/NasirullahNasrat/vestoria-ecommerce.git
   cd vestoria-ecommerce
   ```

2. **Create a Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Database:**
   Update your `settings.py` to configure your database settings.

5. **Run Migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create a Superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the Server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to the Frontend Directory:**
   If your frontend is in a separate directory (e.g., `frontend/`):
   ```bash
   cd frontend
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Run the Frontend:**
   ```bash
   npm start
   ```

## Conclusion

Vestoria is a comprehensive eCommerce solution that showcases the integration of Django and React. I welcome contributions and feedback from the community!
