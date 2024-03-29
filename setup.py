from distutils.core import setup

setup(
    name="Speakeasy",
    version=".1",
    description="Make Conversations Dynamic",
    author="Daniel Frishberg",
    author_email="danielpfrishberg@gmail.com",
    url="http://www.speakeasycomments.com",
    packages=["speakeasy_core"],
    install_requires=["python-openid", "django_openid_auth", "threadedcomments"],
    package_data={"speakeasy_core": ["templates/*.html", "templates/*/*.html", "static/*.*", "static/*/*.*"]}
)
