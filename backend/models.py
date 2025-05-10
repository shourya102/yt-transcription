from __init__ import db, bcrypt


class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    searches = db.relationship('SearchHistory', backref='user', lazy=True)
    downloads = db.relationship('DownloadHistory', backref='user', lazy=True)

    def get_username(self):
        return self.username

    def change_username(self, new_username):
        if User.query.filter_by(username=new_username).first():
            return {"error": "Username already taken"}
        self.username = new_username
        db.session.commit()
        return {"message": "Username updated successfully"}

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def change_password(self, old_password, new_password):
        if not self.check_password(old_password):
            return {"error": "Old password is incorrect"}
        self.set_password(new_password)
        db.session.commit()
        return {"message": "Password updated successfully"}

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def add_search(self, query):
        search = SearchHistory(user_id=self.id, query=query)
        db.session.add(search)
        db.session.commit()

    def get_search_history(self):
        return [search.query for search in self.searches]

    def add_download(self, item):
        download = DownloadHistory(user_id=self.id, item=item)
        db.session.add(download)
        db.session.commit()

    def get_download_history(self):
        return [download.item for download in self.downloads]

    def __repr__(self):
        return f'<User {self.username}>'


class SearchHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    query = db.Column(db.String(255), nullable=False)


class DownloadHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item = db.Column(db.String(255), nullable=False)
