# 🛍️ Vestoria E-commerce Platform

**Vestoria** is a modern, full-featured **eCommerce platform** built with **Django (backend)** and **React (frontend)**.  
It provides a seamless shopping experience for customers, vendors, and administrators.  
This platform now includes **Stripe payment integration** and an **AI-powered product description generator** to boost SEO and automate product listings.

---

## ✨ Features

- **User Roles:** Custom user model with roles for customers, vendors, and administrators  
- **Admin Panel:** Powerful admin interface for managing users, products, and orders  
- **Product Management:** Create, read, update, and delete products and categories  
- **Shopping Cart & Checkout:** Smooth shopping experience with integrated cart and secure checkout  
- **💳 Stripe Payment Integration:** Accept real-time payments securely using Stripe’s API  
- **🤖 AI Description Generator (SEO):** Automatically generate SEO-friendly product descriptions using AI  
- **Order Management:** Track order status and purchase history  
- **Reviews & Ratings:** Customers can share experiences and rate products  
- **Contact Form:** Integrated form for customer inquiries  
- **Responsive UI:** Optimized React frontend for all devices  

---

## 🚀 Admin Panel Access

Access the admin panel at `/admin` with the default credentials:

| Username | Password |
|-----------|-----------|
| admin | admin |

> ⚠️ **Please change the default password after your first login for security purposes.**

---

## 🧠 New Functionalities

### 💳 Stripe Payment Integration
- Integrated **Stripe Checkout API** for secure payment processing  
- Supports multiple currencies and real-time payment validation  
- Securely stores transaction data in the backend  

### 🤖 AI Description Generator for SEO
- Uses an **AI API** to generate engaging, SEO-optimized product descriptions  
- Improves discoverability and saves time for vendors adding new products  
- Allows customization and regeneration of product text  

---

## 📚 Learnings

- Building RESTful APIs with **Django REST Framework**  
- Implementing **JWT authentication** for secure sessions  
- Integrating **Stripe payments** in Django applications  
- Using **AI APIs** for SEO and content automation  
- Managing relational data with Django ORM  
- Handling **CORS** between React and Django  
- Developing responsive frontends with **React**  
- Designing modern **admin panels** with React Admin  

---

## 🧩 Challenges Faced

- 🔐 Implementing secure token-based authentication  
- 💳 Understanding Stripe payment flow and webhook handling  
- 🧠 Handling AI API rate limits and maintaining relevant SEO output  
- 🖼️ Managing image uploads and media files  
- 🌐 Configuring CORS for smooth frontend-backend communication  

---

## 🛠️ Tools & Technologies

| Category | Tools Used |
|-----------|-------------|
| **Backend** | Django, Django REST Framework, Simple JWT |
| **Frontend** | React, React Admin |
| **Database** | SQLite / PostgreSQL |
| **Payment** | Stripe API |
| **AI Integration** | Custom AI API for SEO description generation |
| **Others** | CORS Headers, RESTful Architecture |

---

## ⚙️ Installation Instructions

### 🖥️ Backend Setup

```bash
# 1. Clone the Repository
git clone https://github.com/NasirullahNasrat/vestoria-ecommerce.git
cd vestoria-ecommerce

# 2. Create a Virtual Environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# 3. Install Dependencies
pip install -r requirements.txt

# 4. Configure Database
# (Edit settings.py to use PostgreSQL or SQLite)

# 5. Run Migrations
python manage.py migrate

# 6. Create a Superuser (optional)
python manage.py createsuperuser

# 7. Run the Server
python manage.py runserver

Access the backend at:
👉 http://localhost:8000

💻 Frontend Setup
# 1. Navigate to the Frontend Directory
cd frontend

# 2. Install Dependencies
npm install

# 3. Run the Frontend
npm start

Access the frontend at:
👉 http://localhost:3000


🔧 Default Admin Account

| Username | Password |
| -------- | -------- |
| admin    | admin    |


🤝 Contributing

Contributions, feature requests, and feedback are welcome!

Fork the repository

Create your feature branch (git checkout -b feature-name)

Commit your changes (git commit -m 'Add new feature')

Push to the branch (git push origin feature-name)

Open a Pull Request

📄 License

This project is licensed under the GNU General Public License (GPL).
See the LICENSE
 file for more information.


---

Would you like me to make a **shorter “About project” version** for your GitHub repo main page (good for portfolio use) — like a summary shown above the full README?



