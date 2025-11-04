```
[Requesting] Received request for path: /UserProfile/getProfile
Requesting.request {
  user: '019a0955-92d9-76b0-bc66-58a9b47cca86',
  path: '/UserProfile/getProfile'
} => {
  request: '019a4d78-f27f-7ade-a5fc-0b8a4294bf91',
  input: {
    user: '019a0955-92d9-76b0-bc66-58a9b47cca86',
    path: '/UserProfile/getProfile'
  }
}
Requesting.request {
  user: '019a095b-5d50-7627-a443-367a7b4436ff',
  path: '/UserProfile/getProfile'
} => {
  request: '019a4d78-f28d-7678-8a80-a54cd97d0724',
  input: {
    user: '019a095b-5d50-7627-a443-367a7b4436ff',
    path: '/UserProfile/getProfile'
  }
}
Requesting.request {
  user: '019a0959-67ec-7e94-bfcf-d645e6a4eb49',
  path: '/UserProfile/getProfile'
} => {
  request: '019a4d78-f296-7074-a563-3a69ebd9d9dd',
  input: {
    user: '019a0959-67ec-7e94-bfcf-d645e6a4eb49',
    path: '/UserProfile/getProfile'
  }
}
UserProfile.getProfile { user: '019a0955-92d9-76b0-bc66-58a9b47cca86' } => {
  _id: '019a0955-92d9-76b0-bc66-58a9b47cca86',
  firstName: 'Jing',
  lastName: 'Tan',
  bio: 'A chill person.',
  thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABG4AAAL8CAYAAACxs/MYAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nOzdd3Rc5bn+/Ws0o5lR79WSJbnJveBuTDU2xSHUhJZAknMCJIFDwnlJgZAQksNJgdBC2o8ktAChhF5tsA0uGDfcZUuybKtbvY3aaOb9g4ODvGeksTSa2Xa+n7W8QPd+9t63hNeSdPEUS2t7l1cAAAAAAAAwn'
}
UserProfile.getProfile { user: '019a095b-5d50-7627-a443-367a7b4436ff' } => {
  _id: '019a095b-5d50-7627-a443-367a7b4436ff',
  firstName: 'Jennie',
  lastName: 'Kim',
  bio: null,
  thumbnail: 'data:image/webp;base64,UklGRj6uAABXRUJQVlA4IDKuAAAQLgSdASoAAwADPkkijkUipiEjp9PZ8MAJCWdtVzGf7YOkl6Ur2bKO4g2gw6RhGOvrddf17/YcuLof94/WTyb/qvB29G/0vsBfrR6ZuH3QG43+gR/wfRZ'...
}
Requesting.respond {
  request: '019a4d78-f27f-7ade-a5fc-0b8a4294bf91',
  profile: {
    _id: '019a0955-92d9-76b0-bc66-58a9b47cca86',
    firstName: 'Jing',
    lastName: 'Tan',
    bio: 'A chill person.',
    thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABG4AAAL8CAYAAACxs/MYAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nOzdd3Rc5bn+/Ws0o5lR79WSJbnJveBuTDU2xSHUhJZAknMCJIF'...
  }
} => { request: '019a4d78-f27f-7ade-a5fc-0b8a4294bf91' }
Requesting.respond {
  request: '019a4d78-f28d-7678-8a80-a54cd97d0724',
  profile: {
    _id: '019a095b-5d50-7627-a443-367a7b4436ff',
    firstName: 'Jennie',
    lastName: 'Kim',
    bio: null,
    thumbnail: 'data:image/webp;base64,UklGRj6uAABXRUJQVlA4IDKuAAAQLgSdASoAAwADPkkijkUipiEjp9PZ8MAJCWdtVzGf7YOkl6Ur2bKO4g2gw6RhGOvrddf17/YcuLof94/WTyb/qvB29G/0vsBfrR6ZuH3QG43+gR/wfRZ/V/+B1D/+L9wfUUALmXX0xr9yz9+r/eMtEGHxZ+8vuZ'...
  }
} => { request: '019a4d78-f28d-7678-8a80-a54cd97d0724' }
UserProfile.getProfile { user: '019a0959-67ec-7e94-bfcf-d645e6a4eb49' } => {
  _id: '019a0959-67ec-7e94-bfcf-d645e6a4eb49',
  firstName: 'Roseanne',
  lastName: 'Park',
  bio: null,
  thumbnail: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QAsRXhpZgAASUkqAAgAAAABADwBAgAJAAAAGgAAAAAAAABpbWFnZXJ5NAAA/9sAhAAHBwcHCAcICQkIDAwLDAwREA4OEBEaEhQSFBIaJxgdGBgdGCcjKiIgIiojPjErKzE+SDw5PEhXTk5XbWhtj4'...
}
Requesting.respond {
  request: '019a4d78-f296-7074-a563-3a69ebd9d9dd',
  profile: {
    _id: '019a0959-67ec-7e94-bfcf-d645e6a4eb49',
    firstName: 'Roseanne',
    lastName: 'Park',
    bio: null,
    thumbnail: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QAsRXhpZgAASUkqAAgAAAABADwBAgAJAAAAGgAAAAAAAABpbWFnZXJ5NAAA/9sAhAAHBwcHCAcICQkIDAwLDAwREA4OEBEaEhQSFBIaJxgdGBgdGCcjKiIgIiojPjErKzE+SDw5PEhXTk5XbWhtj4/AAQcHBwcIBwgJCQgMDAsMDB'...
  }
} => { request: '019a4d78-f296-7074-a563-3a69ebd9d9dd' }
} => { notificationIDs: [] }
NotificationLog.getNotifications {
  recipient: '019a4d86-6f65-762e-8bbc-466ba2ef3cf0',
  delivered: undefined,
  dismissed: undefined
} => { notificationIDs: [] }
Requesting.respond {
  request: '019a4d8a-c8de-7043-9b04-efeb8ab511f9',
  notificationIDs: []
} => { request: '019a4d8a-c8de-7043-9b04-efeb8ab511f9' }
[Requesting] Received request for path: /NotificationLog/getNotifications
Requesting.respond {
  request: '019a4d8a-c8e5-73ff-9ace-a618ae149db5',
  notificationIDs: []
} => { request: '019a4d8a-c8e5-73ff-9ace-a618ae149db5' }
Requesting.request {
  recipient: '019a4d86-6f65-762e-8bbc-466ba2ef3cf0',
  path: '/NotificationLog/getNotifications'
} => {
  request: '019a4d8a-c9af-75d0-92c9-d823f7db4128',
  input: {
    recipient: '019a4d86-6f65-762e-8bbc-466ba2ef3cf0',
    path: '/NotificationLog/getNotifications'
  }
}
NotificationLog.getNotifications {
  recipient: '019a4d86-6f65-762e-8bbc-466ba2ef3cf0',
  delivered: undefined,
  dismissed: undefined
} => { notificationIDs: [] }
Requesting.respond {
  request: '019a4d8a-c9af-75d0-92c9-d823f7db4128',
  notificationIDs: []
} => { request: '019a4d8a-c9af-75d0-92c9-d823f7db4128' }
TimeBoundedResource.listExpiredResources { now: 2025-11-04T06:27:56.745Z } => { resourceIDs: [] }
```
