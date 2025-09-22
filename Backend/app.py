from email import message
import json
from shelve import DbfilenameShelf
from flask import Flask, render_template, request, redirect, url_for, jsonify,flash,session,jsonify
import psycopg2
import traceback
from psycopg2 import sql
import os
from flask_mail import Mail, Message
from dotenv import load_dotenv
from config import config
from flask_cors import CORS,cross_origin
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity,verify_jwt_in_request,get_jwt
)
from functools import wraps
from datetime import date


# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config.from_object(config)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000"]}}, supports_credentials=True)
mail = Mail(app)
app.secret_key = os.urandom(24)

app.config["JWT_SECRET_KEY"] = "super-secret-key"  # 🔑 replace with env var in production
jwt = JWTManager(app)

conn = psycopg2.connect(
    dbname="Nxzen",
    user="admin",
    password="nxzen@123",
    host="localhost",
    port="5432"
)

cur = conn.cursor()

def send_login_email(email, temp_password):
    subject = "Your login creds"
    body = f"""
   
    Your login credentials are:
    Login ID (Email): {email}
    Temporary Password: {temp_password}

    change your password here : http://127.0.0.1:5000/employee/reset_password
    Please log in and change your password.
    """
    msg = Message(subject, recipients=[email], body=body)
    try:
        mail.send(msg)
        app.logger.info(f"✅ Login credentials email sent to {email}")
    except Exception as e:
        app.logger.error(f"❌ Failed to send login credentials email: {e}")
        flash("Login email sending failed. Check logs.", "danger")
    return True             



def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"error": "Forbidden: insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper



#hr create employee
@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    return response

@app.route("/hr/create_employee", methods=["POST"])
@jwt_required
@role_required("HR")
def create_employee():
    
    employee_id = get_jwt_identity() 
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        data=request.get_json()
        name = data.get("name")
        email = data.get("email")
        role=data.get("role")

        if not name or not email:
            
            return jsonify({"error":"name and email are required"}),400

        cur.execute("SELECT add_employee(%s, %s,%s);", (name, email,role))
        result = cur.fetchone()
        conn.commit()
            
            
        if result:
            temp_password = result
            send_login_email(email, temp_password)
            return jsonify({"message":"employee created","employee_id":{employee_id}}),201
        return jsonify({"message":"employee created"}),201
    except Exception as e:
        conn.rollback()
        return jsonify({"error":str(e)}),500





#login
@app.route("/login", methods=["POST"])
def login():
    try:
        # React will send JSON { email, password, role }
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()
        role = data.get("role", "").strip()
 
        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400
 
        cur.execute("""
            SELECT id, name, role
            FROM employees
            WHERE email = %s
              AND role = %s
              AND password_hash IS NOT NULL
              AND password_hash = crypt(%s, password_hash);
        """, (email, role, password))
        user = cur.fetchone()
 
        if user:
            employee_id=user[0]
            employee_role = user[2]
            access_token = create_access_token(identity=str(employee_id), additional_claims={"role": employee_role})

            session["user"] = {"employeeId": user[0], "name": user[1], "role": user[2]}
            return jsonify({
                "employeeId": user[0],
                "name": user[1],
                "role": user[2],   
                "access_token": access_token,
                "message": f"Welcome, {user[1]}!"
            })
        else:
            return jsonify({"error": "Invalid credentials"}), 401
 
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#reset_password
@app.route("/reset_password", methods=[ "POST"])
def reset_password():
    try:
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        old_password = data.get("currentPassword", "").strip()
        new_password = data.get("newPassword", "").strip()
        

        if not email or not old_password or not new_password:
           return jsonify({"status": "error", "message": "Missing required fields"}), 400
        
        
        cur.execute("SELECT set_emp_password(%s,%s,%s);", (email, old_password, new_password))
        conn.commit()
        return jsonify({"status": "success", "message": "Password updated successfully"}), 200
            
    except Exception as e:
        conn.rollback()
        flash(f"Error: {str(e)}", "error")
        return jsonify({"status": "error", "message": str(e)}), 500
    

#forgot password

@app.route("/employee/forgot_password",methods=["GET","POST"])
def forgot_password():
    if request.method=="POST":
        email=request.form.get("email","").strip()
        if not email:
            flash("email required","error")
            return redirect(url_for("forgot_password"))
        try:
            cur.execute("select forgot_password(%s);",(email,))
            result = cur.fetchone()
            conn.commit()
            
            if result:
                temp_password=result[0]
                send_login_email(email, temp_password)
                return redirect(url_for("forgot_password"))
            else:
                return redirect(url_for("forgot_password"))

        except Exception as e:
            conn.rollback()
            flash(f"Error: {str(e)}", "error")

        return redirect(url_for("login"))

    return render_template("forgot_password.html")


#document upload
@app.route("/upload_document", methods=["GET", "POST"])
def upload_document():
    if request.method == "POST":
        #employee_id = request.form.get("employee_id")

        file=request.files.get("aadhaar")
        if not file:
            flash("No file selected", "error")
            return redirect(url_for("upload_document"))

        try:
            file_name = file.filename
            file_type = file.mimetype
            file_data = file.read()
            print("File name:", file_name)
            print("File type:", file_type)
            print("File size:", len(file_data))

            cur.execute(
                "SELECT upload_document(%s, %s, %s, %s);",
                (int(12), file_name, file_type, psycopg2.Binary(file_data)),
            )
            print("hhhhhhhhhhhh")
            conn.commit()
            flash("documents uploaded", "success")
            return render_template("employee_dashboard.html")  # adjust route

        except Exception as e:
            conn.rollback()
            print("ERROR:", str(e))
            traceback.print_exc()
            flash(f"Error: {str(e)}", "error")
            return redirect(url_for("upload_document"))

    # For GET request: render upload form
    return render_template("upload_document.html")

from flask import request, jsonify

@app.route("/apply_leave", methods=["POST"])
@jwt_required()

def apply_leave():
    
    employee_id = get_jwt_identity() 
    print(employee_id)
    # if "user" not in session:
    #     return jsonify({"error": "Unauthorized"}), 401
    try:
        data = request.get_json()
        print("📥 Incoming request:", data)



        employee_id = int(employee_id)

        leave_type = data.get("leave_type")
        reason = data.get("reason")
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if not (employee_id and leave_type and start_date and end_date):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        # Call PostgreSQL function
        cur.execute(
            "SELECT apply_leave(%s, %s, %s, %s, %s);",
            (int(employee_id), leave_type, reason, start_date, end_date),
        )
        conn.commit()

        return jsonify({"status": "success", "message": "Leave applied successfully"}), 200

    except Exception as e:
        conn.rollback()
        import traceback; traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/approve_leave/<int:leave_id>", methods=["POST"])
@jwt_required()
@role_required("HR","Manager")
def approve_leave(leave_id):
    try:
        approver_id = get_jwt_identity()  # the logged-in HR or Manager
        data = request.get_json()
        status = data.get("status")  # "Approved" or "Rejected"

        if not status:
            return jsonify({"error": "Status is required"}), 400

        # Call PostgreSQL function
        cur.execute(
            "SELECT approve_leave(%s, %s, %s);",
            (leave_id, approver_id, status)
        )
        result = cur.fetchone()
        conn.commit()

        return jsonify({
            "status": "success",
            "message": result[0] if result else "Approval recorded"
        }), 200

    except Exception as e:
        conn.rollback()
        import traceback; traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/leave_balances/<int:employee_id>", methods=["GET"])
@jwt_required()
@cross_origin()
def get_leave_balances(employee_id):
    try:
        cur.execute("""
            SELECT sick_leaves, casual_leaves, paid_leaves
            FROM leave_balance
            WHERE employee_id = %s
        """, (employee_id,))
        row = cur.fetchone()

        if not row:
            return jsonify({"error": "Leave balance not found"}), 404

        leaveBalances = {
            "Sick": row[0],
            "Casual": row[1],
            "Annual": row[2]
        }
        return jsonify(leaveBalances), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/all_leaves/<int:employee_id>", methods=["GET"])
@jwt_required()
@cross_origin()
def get_all_leaves(employee_id):
    try:
        cur.execute("""
            SELECT id, leave_type, start_date, end_date, no_of_days, reason, status
            FROM leave_management
            WHERE employee_id = %s
            ORDER BY start_date DESC
        """, (employee_id,))
        rows = cur.fetchall()

        today = date.today()
        past, current, upcoming = [], [], []

        for r in rows:
            leave = {
                "id": r[0],
                "type": r[1],
                "startDate": r[2],
                "endDate": r[3],
                "days": r[4],
                "reason": r[5],
                "status": r[6]
            }

            if r[3] < today:  # already ended
                past.append(leave)
            elif r[2] <= today <= r[3]:  # currently ongoing
                current.append(leave)
            else:  # future leave
                upcoming.append(leave)

        return jsonify(rows), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/attendance", methods=["POST"])
@jwt_required()
def save_attendance():
    try:
        employee_id = get_jwt_identity()
        data = request.get_json()

        for date_str, entry in data.items():
            cur.execute("SELECT save_attendance(%s, %s, %s, %s, %s);", (
                employee_id,
                date_str,
                entry.get("action"),
                entry.get("hours"),
                entry.get("project"),
            ))

        conn.commit()
        return jsonify({"success": True, "message": "Attendance submitted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/managers",methods=["GET"])
def display_managers():
    
    cur.execute("SELECT id,name FROM employees WHERE role = 'Manager';")
    managers = cur.fetchall()
    cur.close()
    manager_list = [{"id":m[0],"name":m[1]} for m in managers]

    return jsonify({"managers": manager_list})

@app.route("/hrs",methods=["GET"])
def display_hrs():
    cur.execute("select id,name from employees where role='HR';")
    hrs=cur.fetchall()
    cur.close()
    hr_list=[{"id":h[0],"name":h[1]} for h in hrs]
    return jsonify({"HRs":hr_list})

@app.route("/employees",methods=["GET"])
def display_emps():
    cur.execute("""SELECT
    e.id AS "employeeId",
    e.name,
    e.email,
    e.role,
    ARRAY_REMOVE(ARRAY[
        m1.name,
        m2.name
    ], NULL) AS hr,
    ARRAY_REMOVE(ARRAY[
        mgr1.name,
        mgr2.name,
        mgr3.name
    ], NULL) AS managers
FROM employees e
LEFT JOIN employee_master em ON e.id = em.emp_id
LEFT JOIN employees m1 ON em.hr1_id = m1.id
LEFT JOIN employees m2 ON em.hr2_id = m2.id
LEFT JOIN employees mgr1 ON em.manager1_id = mgr1.id
LEFT JOIN employees mgr2 ON em.manager2_id = mgr2.id
LEFT JOIN employees mgr3 ON em.manager3_id = mgr3.id;
""")
    emps=cur.fetchall()
    cur.close()
    employees = []
    for row in emps:
        employees.append({
            "employeeId": row[0],
            "name": row[1],
            "email": row[2],
            "role": row[3],
            "hr": row[4],
            "managers": row[5]
        })

    return jsonify(employees)


@app.route("/assign",methods=["POST"])
def assign():
    try:
        data=request.get_json()
        emp_id=data.get("id")
        manager1_id=data.get("manager1_id")
        manager2_id=data.get("manager2_id")
        manager3_id=data.get("manager3_id")
        hr1_id=data.get("hr1_id")
        hr2_id=data.get("hr2_id")
        if not(emp_id and manager1_id and hr1_id):
            return jsonify({"status":"error","message":"missing data"}),400
        
        cur.execute(
            "select save_employee_master(%s,%s,%s,%s,%s,%s);",
            (emp_id,manager1_id,hr1_id,manager2_id,manager3_id,hr2_id),
        )
        conn.commit()
        
        return jsonify({"status":"success","message":"Assigned successfully"}),200

    except Exception as e:
        conn.rollback()
        import traceback; traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

    
    


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)