# Vestoria E-commerce Platform

**Vestoria** is a modern eCommerce platform designed to provide a seamless shopping experience for both customers and vendors. Built with Django for the backend and React for the frontend, Vestoria supports features such as user authentication, product management, and order processing.

## ✨ Features

- **User Roles:** Custom user model with roles for customers, vendors, and administrators
- **Admin Panel:** Comprehensive administration interface for managing users, products, and orders
- **Product Management:** Create, read, update, and delete products and categories
- **Shopping Cart:** Users can add products to their cart and proceed to checkout
- **Order Management:** Track order status and history
- **Reviews & Ratings:** Customers can leave reviews and ratings for products
- **Contact Form:** Users can submit inquiries through a contact form

## 🚀 Admin Panel Access

The admin panel is available at `/admin` path with the following credentials:
- **Username:** `admin`
- **Password:** `admin`

*Please change the default password after your first login for security reasons.*

## 📚 Learnings

Through the development of Vestoria, I gained significant experience in:

- Building RESTful APIs with Django REST Framework
- Implementing JWT authentication for secure user access
- Managing complex database relationships using Django's ORM
- Creating a responsive frontend with React, enhancing user experience
- Handling state management in React applications
- Developing comprehensive admin interfaces for content management

## 🧩 Challenges Faced

- **User Authentication:** Implementing secure JWT authentication was challenging initially, but I learned how to manage token-based authentication effectively
- **Handling Media Files:** Managing image uploads and storage required careful configuration to ensure that files were served correctly
- **Cross-Origin Resource Sharing (CORS):** Configuring CORS to allow communication between the frontend and backend was a learning curve
- **Admin Interface:** Creating an intuitive yet powerful admin panel required careful consideration of user workflows

## 🛠️ Tools Used

- **Django:** Web framework for building the backend
- **Django REST Framework:** For creating RESTful APIs
- **React Admin:** For the administration interface
- **Django Simple JWT:** For token-based authentication
- **React:** Frontend library for building user interfaces
- **CORS Headers:** To handle CORS issues
- **PostgreSQL:** You can change the Database from sqlite to PostgreSQL in settings.py

## ⚙️ Installation Instructions

### Backend Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/NasirullahNasrat/vestoria-ecommerce.git
   cd vestoria-ecommerce
Create a Virtual Environment:

bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
Install Dependencies:

bash
pip install -r requirements.txt
Configure Database:
Update your settings.py to configure your database settings.

Run Migrations:

bash
python manage.py migrate
Create a Superuser (Optional):

bash
python manage.py createsuperuser
Note: The admin panel comes with a default admin account (username: admin, password: admin)

Run the Server:

bash
python manage.py runserver
Access Admin Panel:
Navigate to http://localhost:3000/admin/login and login with the default credentials or your superuser account.

Frontend Setup
Navigate to the Frontend Directory:
If your frontend is in a separate directory (e.g., frontend/):

bash
cd frontend
Install Frontend Dependencies:

bash
npm install
Run the Frontend:

bash
npm start
🔧 Default Admin Account
For quick testing, the application includes a default admin account:

Username: admin

Password: admin

Important: It is highly recommended to change this password immediately after your first login or create a new superuser account for production use.

🤝 Contributing
Vestoria is a comprehensive eCommerce solution that showcases the integration of Django and React. I welcome contributions and feedback from the community!


📄 License
This project is licensed under the GNU GENERAL PUBLIC LICENSE.
