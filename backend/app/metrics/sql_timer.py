import time

class SQLTimer:

    def __enter__(self):
        self.start=time.perf_counter()
        return self

    def __exit__(self,*args):
        self.elapsed=(time.perf_counter()-self.start)*1000

with SQLTimer() as timer:
    suppliers=db.query(Supplier).all()

print(timer.elapsed)